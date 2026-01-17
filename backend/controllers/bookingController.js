import mongoose from "mongoose";
import Booking from "../models/bookingModel.js";
import Car from "../models/carModel.js";
import path from 'path';
import fs from 'fs';
import { sendAdminBookingEmail, sendCustomerBookingEmail } from "../config/email.js";
import { sendWhatsAppTwilio } from "../config/whatsapp.js";

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const BLOCKING_STATUSES = ["pending", "active", "upcoming"];

const tryParseJSON = (v) => {
  if(typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

const buildCarSummary = (src ={}) => {
  const id = src._id?.toString?.() || src.id || null

  return {
    id,
    make: src.make,
    model: src.model || "",
    year: src.year ? Number(src.year) : null,
    dailyRate: src.dailyRate ? Number(src.dailyRate) : 0,
    seats: src.seats ? Number(src.seats) : 4,
    transmission: src.transmission,
    fuelType: src.fuelType,
    mileage: src.mileage ? Number(src.mileage) : 0,
    image: src.image || src.carImage || "",
  };
}

const deleteLocalFileIfPresent = (filePath) => {
  if (!filePath) return;
  const filename = filePath.replace(/^\/uploads\//, '');
  const full = path.join(UPLOADS_DIR, filename);
  fs.unlink(full, (err) => { if (err) console.warn('Failed to delete file:', full, err)});
};

// HELPER: Send notifications in background (non-blocking)
const sendBookingNotifications = async (booking) => {
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

    // Send all notifications (don't await - let them run in background)
    Promise.all([
      sendWhatsAppTwilio({
        to: process.env.ADMIN_WHATSAPP,
        message
      }).catch(err => console.error('WhatsApp notification failed:', err.message)),
      
      sendCustomerBookingEmail(booking)
        .catch(err => console.error('Customer email failed:', err.message)),
      
      sendAdminBookingEmail(booking)
        .catch(err => console.error('Admin email failed:', err.message))
    ])
    .then(() => console.log('✅ All notifications sent successfully'))
    .catch(err => console.error('⚠️ Some notifications failed:', err.message));

  } catch (err) {
    console.error('❌ Notification error:', err.message);
  }
};

// HELPER: Execute booking creation with retry logic
const executeBookingCreation = async (req, retryCount = 0) => {
  const maxRetries = 3;
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    let { customer, email, phone, car, pickupDate, returnDate, amount, details, address, carImage } = req.body;

    if (!customer || !email || !car || !pickupDate || !returnDate) {
      await session.abortTransaction();
      session.endSession();
      throw new Error('Missing required fields');
    }

    const pickup = new Date(pickupDate);
    const ret = new Date(returnDate);

    if (Number.isNaN(pickup.getTime()) || Number.isNaN(ret.getTime()) || pickup > ret) {
      await session.abortTransaction();
      session.endSession();
      throw new Error('Invalid pickup and return date');
    }

    // Resolve car summary
    let carSummary = null;
    if (typeof car === "string" && /^[0-9a-fA-F]{24}$/.test(car)) {
      const carDoc = await Car.findById(car).session(session).lean();
      if (!carDoc) {
        await session.abortTransaction();
        session.endSession();
        throw new Error("Car not found");
      }
      carSummary = buildCarSummary(carDoc);
    } else {
      const parsed = tryParseJSON(car) || car;
      carSummary = buildCarSummary(parsed);
      if (!carSummary.id) {
        await session.abortTransaction();
        session.endSession();
        throw new Error("Invalid car payload");
      }
      const carExists = await Car.exists({ _id: carSummary.id }).session(session);
      if (!carExists) {
        await session.abortTransaction();
        session.endSession();
        throw new Error("Car not found");
      }
    }

    const carId = carSummary.id;
    const overlappingCount = await Booking.countDocuments({
      "car.id": carId,
      status: { $in: BLOCKING_STATUSES },
      pickupDate: { $lte: ret },
      returnDate: { $gte: pickup },
    }).session(session);

    if (overlappingCount > 0) {
      await session.abortTransaction();
      session.endSession();
      throw new Error('Car already booked for these dates');
    }

    const bookingData = {
      userId: req?.user?.id || req.user?._id || null,
      customer, email, phone,
      car: carSummary,
      carImage: carImage || carSummary.image || "",
      pickupDate: pickup,
      returnDate: ret,
      amount: Number(amount || 0),
      details: tryParseJSON(details),
      address: tryParseJSON(address),
      paymentStatus: "pending",
      status: "pending",
    };

    const createdArr = await Booking.create([bookingData], { session });
    const createdBooking = createdArr[0];
    
    await session.commitTransaction();
    console.log('✅ Transaction committed successfully');
    
    session.endSession();
    
    // Update car bookings OUTSIDE of transaction to avoid write conflicts
    const bookingEntry = {
      bookingid: createdBooking._id,
      pickupDate: createdBooking.pickupDate,
      returnDate: createdBooking.returnDate,
      status: createdBooking.status,
    };

    // This runs outside transaction, so it won't cause conflicts
    await Car.findByIdAndUpdate(
      carId, 
      { $push: { bookings: bookingEntry } }
    ).catch(err => {
      console.error('Warning: Failed to update car bookings array:', err.message);
      // Don't fail the whole booking if this fails
    });
    
    const saved = await Booking.findById(createdBooking._id);
    return saved;

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    // Retry on write conflict
    if (err.code === 112 && retryCount < maxRetries) {
      console.log(`⚠️ Write conflict detected, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1))); // Exponential backoff
      return executeBookingCreation(req, retryCount + 1);
    }
    
    throw err;
  }
};

//CREATE BOOKING
export const createBooking = async (req, res) => {
  try {
    const saved = await executeBookingCreation(req);

    // ✅ RESPOND TO FRONTEND IMMEDIATELY (before notifications)
    res.status(201).json({
      success: true,
      booking: saved
    });

    // 🔔 SEND NOTIFICATIONS IN BACKGROUND (non-blocking)
    setImmediate(() => {
      sendBookingNotifications(saved);
    });

  } catch (err) {
    console.error('❌ Create Booking Error:', err);
    
    const statusCode = 
      err.message.includes('Missing required fields') ? 400 :
      err.message.includes('Invalid') ? 400 :
      err.message.includes('not found') ? 404 :
      err.message.includes('already booked') ? 409 :
      500;
    
    return res.status(statusCode).json({
      success: false,
      message: err.message
    });
  }
};

//GET FUNCTION
export const getBookings = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 12, 100);
    const search = req.query.search?.trim() || "";
    const status = req.query.status?.trim() || "";
    const carFilter = req.query.car?.trim() || "";
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const query = {};
    if (search) {
      const q = { $regex: search, $options: "i" };
      query.$or = [{ customer: q }, { email: q }, { "car.make": q }, { "car.model": q }];
    }

    if (status) query.status = status;
    if (carFilter) {
      if (/^[0-9a-fA-F]{24}$/.test(carFilter)) query["car.id"] = carFilter;
      else query.$or = [...(query.$or || []), { "car.make": { $regex: carFilter, $options: "i" } }, { "car.model": { $regex: carFilter, $options: "i" } }];
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

         res.json({
          page,
          pages: Math.ceil(total / limit),
          total,
          data: bookings
         });
  } catch (err) {
        next(err);
  }
}

//GET BOOKING FOR A PARTICULAR USER
export const getMyBookings = async (req, res, next) => {
  try {
    if (!req.user || (!req.user.id && !req.user._id))
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const userId = req.user._id || req.user.id;
    const bookings = await Booking.find({userId}).sort({bookingDate: -1}).lean();
    res.json(bookings);
  } catch (err) {
      next(err);
  }
}

// UPDATE FUNCTION
export const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    //image handling
    if (req.file) {
      if (booking.carImage && booking.carImage.startsWith("/uploads/")) deleteLocalFileIfPresent(booking.carImage);
      booking.carImage = `/uploads/${req.file.filename}`;
    } else if (req.body.carImage !== undefined) {
      if (req.body.carImage && !String(req.body.carImage).startsWith("/uploads/") && booking.carImage && booking.carImage.startsWith("/uploads/")) {
        deleteLocalFileIfPresent(booking.carImage);
      }
      booking.carImage = req.body.carImage || booking.carImage;
    }

    const updatable = ["customer", "email", "phone", "car", "pickupDate", "returnDate", "bookingDate", "status", "amount", "details", "address"];
    for (const f of updatable) {
      if (req.body[f] === undefined) continue;
      if (["pickupDate", "returnDate", "bookingDate"].includes(f)) booking[f] = new Date(req.body[f]);
      else if (f === "amount") booking[f] = Number(req.body[f]);
      else if (f === "details" || f === "address") booking[f] = tryParseJSON(req.body[f]);
      else if (f === "car") {
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
}

// UPDATE THE STATUS OF BOOKING ORDER
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required'});
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = status;
    const updated = await booking.save();
    res.json(updated);
  } catch (err) {
        next(err)
  }
}

//DELETE FUNCTION
export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.carImage && booking.carImage.startsWith('/uploads/'))
       deleteLocalFileIfPresent(booking.carImage);

    await booking.remove();
    res.json({message: 'Booking deleted successfully'});
  } catch (err) {
       next(err);
  }
}