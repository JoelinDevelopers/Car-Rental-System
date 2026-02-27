import mongoose from "mongoose";
import Booking from "../models/bookingModel.js";
import Car from "../models/carModel.js";
import path from 'path';
import fs from 'fs';
import { sendAdminBookingEmail, sendCustomerBookingEmail } from "../config/email.js";
import { sendWhatsAppTwilio } from "../config/whatsapp.js";
import cloudinary from "../config/cloudinary.js";

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// In-memory request deduplication cache
const requestCache = new Map();
const CACHE_TTL = 30000;

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) requestCache.delete(key);
  }
}, 60000);

const tryParseJSON = (v) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
};

// ✅ SAFE: Check if a string is a valid MongoDB ObjectId without throwing
const isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
};

const buildCarSummary = (src = {}) => {
  // ✅ FIX: Prefer _id, then id — convert to string safely
  const rawId = src._id?.toString?.() || src.id || null;
  const id = rawId ? String(rawId) : null;

  return {
    id,
    make: src.make || '',
    model: src.model || '',
    year: src.year ? Number(src.year) : null,
    dailyRate: src.dailyRate ? Number(src.dailyRate) : 0,
    seats: src.seats ? Number(src.seats) : 4,
    transmission: src.transmission || '',
    fuelType: src.fuelType || '',
    mileage: src.mileage ? Number(src.mileage) : 0,
    image: src.image || src.carImage || '',
  };
};

const deleteLocalFileIfPresent = (filePath) => {
  if (!filePath) return;
  const filename = filePath.replace(/^\/uploads\//, '');
  const full = path.join(UPLOADS_DIR, filename);
  fs.unlink(full, (err) => { if (err) console.warn('Failed to delete file:', full, err); });
};

const deleteCloudinaryFile = async (cloudinaryId) => {
  if (!cloudinaryId) return;
  try {
    await cloudinary.uploader.destroy(cloudinaryId);
    console.log('🗑️ Cloudinary file deleted:', cloudinaryId);
  } catch (err) {
    console.warn('Failed to delete from Cloudinary:', cloudinaryId, err);
  }
};

const sendBookingNotifications = async (booking) => {
  console.log('📢 Starting to send notifications...');
  try {
    const message = `
🚗 NEW BOOKING

Customer: ${booking.customer}
Car: ${booking.car.make} ${booking.car.model}
Pickup: ${booking.pickupDate.toDateString()}
Return: ${booking.returnDate.toDateString()}
Amount: Kes ${booking.amount}
Status: ${booking.status}
    `.trim();

    Promise.all([
      sendWhatsAppTwilio({ to: process.env.ADMIN_WHATSAPP, message })
        .then(r => { console.log('✅ WhatsApp sent:', r.sid); })
        .catch(err => { console.error('❌ WhatsApp failed:', err.message); }),
      sendCustomerBookingEmail(booking)
        .then(() => { console.log('✅ Customer email sent'); })
        .catch(err => { console.error('❌ Customer email failed:', err.message); }),
      sendAdminBookingEmail(booking)
        .then(() => { console.log('✅ Admin email sent'); })
        .catch(err => { console.error('❌ Admin email failed:', err.message); }),
    ])
      .then(() => console.log('🎉 All notifications sent'))
      .catch(err => console.error('⚠️ Some notifications failed:', err.message));
  } catch (err) {
    console.error('❌ Notification error:', err.message);
  }
};

const generateDeduplicationKey = (data) => {
  const { email, car, pickupDate, returnDate, customer } = data;
  const carId = typeof car === 'string' ? car : (car?.id || JSON.stringify(car));
  return `${email}-${carId}-${pickupDate}-${returnDate}-${customer}`.toLowerCase();
};

const executeBookingCreation = async (req) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let { customer, email, phone, car, pickupDate, returnDate, amount, details, address, carImage } = req.body;

    if (!customer || !email || !car || !pickupDate || !returnDate) {
      throw new Error('Missing required fields');
    }

    const pickup = new Date(pickupDate);
    const ret = new Date(returnDate);

    if (Number.isNaN(pickup.getTime()) || Number.isNaN(ret.getTime()) || pickup > ret) {
      throw new Error('Invalid pickup and return date');
    }

    const daysDiff = Math.ceil((ret - pickup) / (1000 * 60 * 60 * 24));
    if (daysDiff < 3) {
      throw new Error('Minimum booking period is 3 days');
    }

    // ✅ FIX: Resolve car summary with safe ObjectId handling
    let carSummary = null;

    if (typeof car === 'string' && isValidObjectId(car)) {
      // Sent as a plain ObjectId string
      const carDoc = await Car.findById(car).session(session).lean();
      if (!carDoc) throw new Error('Car not found');
      carSummary = buildCarSummary(carDoc);
    } else {
      // Sent as a JSON object (the normal path from the frontend)
      const parsed = tryParseJSON(car);
      carSummary = buildCarSummary(parsed);

      if (!carSummary.id) {
        throw new Error('Invalid car payload: missing car ID');
      }

      // ✅ FIX: Only query DB if the ID is a valid ObjectId — skip the check otherwise
      if (isValidObjectId(carSummary.id)) {
        const carExists = await Car.exists({ _id: carSummary.id }).session(session);
        if (!carExists) throw new Error('Car not found');
      } else {
        console.warn('⚠️ Car ID is not a valid ObjectId, skipping DB existence check. ID:', carSummary.id);
        // Still allow booking to proceed — the car summary data came from the frontend
      }
    }

    // Handle ID photo upload
    let idPhotoUrl = '';
    let idPhotoCloudinaryId = '';
    if (req.files?.idPhoto) {
      idPhotoUrl = req.files.idPhoto[0].path;
      idPhotoCloudinaryId = req.files.idPhoto[0].filename;
      console.log('✅ ID photo uploaded to Cloudinary:', idPhotoUrl);
    }

    // Handle Driver's License photo upload
    let licensePhotoUrl = '';
    let licensePhotoCloudinaryId = '';
    if (req.files?.licensePhoto) {
      licensePhotoUrl = req.files.licensePhoto[0].path;
      licensePhotoCloudinaryId = req.files.licensePhoto[0].filename;
      console.log('✅ License photo uploaded to Cloudinary:', licensePhotoUrl);
    }

    // ✅ FIX: userId — only set if it's a valid ObjectId, otherwise null
    const rawUserId = req?.user?.id || req?.user?._id || req.body.userId || null;
    const userId = rawUserId && isValidObjectId(String(rawUserId)) ? rawUserId : null;

    const bookingData = {
      userId,
      customer,
      email,
      phone,
      car: carSummary,
      carImage: carImage || carSummary.image || '',
      pickupDate: pickup,
      returnDate: ret,
      amount: Number(amount || 0),
      details: tryParseJSON(details),
      address: tryParseJSON(address),
      idPhoto: idPhotoUrl,
      idPhotoCloudinaryId,
      licensePhoto: licensePhotoUrl,
      licensePhotoCloudinaryId,
      paymentStatus: 'pending',
      status: 'pending',
    };

    const createdArr = await Booking.create([bookingData], { session });
    const createdBooking = createdArr[0];

    await session.commitTransaction();
    console.log('✅ Transaction committed - Booking ID:', createdBooking._id);
    session.endSession();

    const saved = await Booking.findById(createdBooking._id);
    return saved;

  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();

    if (req.files?.idPhoto?.[0]?.filename) await deleteCloudinaryFile(req.files.idPhoto[0].filename);
    if (req.files?.licensePhoto?.[0]?.filename) await deleteCloudinaryFile(req.files.licensePhoto[0].filename);

    throw err;
  }
};

// CREATE BOOKING - WITH DEDUPLICATION
export const createBooking = async (req, res) => {
  const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random()}`;

  console.log('🔵 CREATE BOOKING CALLED - Request ID:', requestId);
  console.log('🔵 Body fields:', {
    customer: req.body.customer,
    email: req.body.email,
    car: typeof req.body.car === 'string' ? req.body.car.substring(0, 80) : 'object',
    pickupDate: req.body.pickupDate,
    returnDate: req.body.returnDate,
    userId: req.body.userId,
  });

  try {
    const dedupKey = generateDeduplicationKey(req.body);
    console.log('🔑 Deduplication Key:', dedupKey);

    const cachedRequest = requestCache.get(dedupKey);
    const now = Date.now();

    if (cachedRequest && (now - cachedRequest.timestamp) < CACHE_TTL) {
      console.log('⚠️ DUPLICATE REQUEST DETECTED - Returning cached response');
      return res.status(201).json({
        success: true,
        booking: cachedRequest.booking,
        _isDuplicate: true,
      });
    }

    requestCache.set(dedupKey, { timestamp: now, processing: true });

    const saved = await executeBookingCreation(req);

    requestCache.set(dedupKey, { timestamp: now, booking: saved, processing: false });

    console.log('📤 Responding to frontend - Booking ID:', saved._id);
    res.status(201).json({ success: true, booking: saved });

    setImmediate(() => {
      console.log('🔔 Sending notifications...');
      sendBookingNotifications(saved);
    });

  } catch (err) {
    console.error('❌ Create Booking Error:', err.message);
    console.error('❌ Stack:', err.stack);

    const dedupKey = generateDeduplicationKey(req.body);
    requestCache.delete(dedupKey);

    const statusCode =
      err.message.includes('Missing required fields') ? 400 :
      err.message.includes('Invalid') ? 400 :
      err.message.includes('Minimum booking period') ? 400 :
      err.message.includes('not found') ? 404 :
      500;

    return res.status(statusCode).json({ success: false, message: err.message });
  }
};

// GET ALL BOOKINGS
export const getBookings = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 12, 100);
    const search = req.query.search?.trim() || '';
    const status = req.query.status?.trim() || '';
    const carFilter = req.query.car?.trim() || '';
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const query = {};
    if (search) {
      const q = { $regex: search, $options: 'i' };
      query.$or = [{ customer: q }, { email: q }, { 'car.make': q }, { 'car.model': q }];
    }
    if (status) query.status = status;
    if (carFilter) {
      if (isValidObjectId(carFilter)) query['car.id'] = carFilter;
      else query.$or = [...(query.$or || []), { 'car.make': { $regex: carFilter, $options: 'i' } }, { 'car.model': { $regex: carFilter, $options: 'i' } }];
    }
    if (from || to) {
      query.pickupDate = {};
      if (from) query.pickupDate.$gte = from;
      if (to) query.pickupDate.$lte = to;
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ bookingDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ page, pages: Math.ceil(total / limit), total, data: bookings });
  } catch (err) {
    next(err);
  }
};

// GET BOOKINGS FOR A PARTICULAR USER
export const getMyBookings = async (req, res, next) => {
  try {
    if (!req.user || (!req.user.id && !req.user._id))
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const userId = req.user._id || req.user.id;
    const bookings = await Booking.find({ userId }).sort({ bookingDate: -1 }).lean();
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// UPDATE BOOKING
export const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.file) {
      if (booking.carImage?.startsWith('/uploads/')) deleteLocalFileIfPresent(booking.carImage);
      booking.carImage = `/uploads/${req.file.filename}`;
    } else if (req.body.carImage !== undefined) {
      if (req.body.carImage && !String(req.body.carImage).startsWith('/uploads/') && booking.carImage?.startsWith('/uploads/')) {
        deleteLocalFileIfPresent(booking.carImage);
      }
      booking.carImage = req.body.carImage || booking.carImage;
    }

    if (req.files?.idPhoto) {
      if (booking.idPhotoCloudinaryId) await deleteCloudinaryFile(booking.idPhotoCloudinaryId);
      booking.idPhoto = req.files.idPhoto[0].path;
      booking.idPhotoCloudinaryId = req.files.idPhoto[0].filename;
    }

    if (req.files?.licensePhoto) {
      if (booking.licensePhotoCloudinaryId) await deleteCloudinaryFile(booking.licensePhotoCloudinaryId);
      booking.licensePhoto = req.files.licensePhoto[0].path;
      booking.licensePhotoCloudinaryId = req.files.licensePhoto[0].filename;
    }

    const updatable = ['customer', 'email', 'phone', 'car', 'pickupDate', 'returnDate', 'bookingDate', 'status', 'amount', 'details', 'address'];
    for (const f of updatable) {
      if (req.body[f] === undefined) continue;
      if (['pickupDate', 'returnDate', 'bookingDate'].includes(f)) booking[f] = new Date(req.body[f]);
      else if (f === 'amount') booking[f] = Number(req.body[f]);
      else if (f === 'details' || f === 'address') booking[f] = tryParseJSON(req.body[f]);
      else if (f === 'car') {
        const c = tryParseJSON(req.body.car);
        if (c) {
          const summary = buildCarSummary(c);
          if (!summary.id && booking.car?.id) summary.id = booking.car.id;
          booking.car = summary;
        }
      } else booking[f] = req.body[f];
    }

    const updated = await booking.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// UPDATE BOOKING STATUS
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = status;
    const updated = await booking.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE BOOKING
export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.carImage?.startsWith('/uploads/')) deleteLocalFileIfPresent(booking.carImage);
    if (booking.idPhotoCloudinaryId) await deleteCloudinaryFile(booking.idPhotoCloudinaryId);
    if (booking.licensePhotoCloudinaryId) await deleteCloudinaryFile(booking.licensePhotoCloudinaryId);

    await booking.remove();
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    next(err);
  }
};