import Booking from '../models/bookingModel.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { sendAdminBookingEmail, sendCustomerBookingEmail } from "../config/email.js";
import { sendWhatsAppTwilio } from "../config/whatsapp.js";

dotenv.config();

// const CLIENT_URL = 'http://localhost:5173';
const CLIENT_URL = 'https://aurumdriverentals.com'
const STRIPE_API_VERSION = "2022-11-15";

const getStripe = () => {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  return new Stripe(key, {apiVersion: STRIPE_API_VERSION})
};

const sendBookingNotifications = async (booking) => {
  console.log('📢 Starting to send notifications for paid booking...');
  
  try {
    const message = `
🚗 NEW BOOKING - PAYMENT CONFIRMED

Customer: ${booking.customer}
Car: ${booking.car.make || booking.car.name || 'Car'} ${booking.car.model || ''}
Pickup: ${booking.pickupDate.toDateString()}
Return: ${booking.returnDate.toDateString()}
Amount: Kes ${booking.amount}
Status: ${booking.status}
Payment: PAID ✅
    `.trim();

    console.log('📱 Attempting WhatsApp to:', process.env.ADMIN_WHATSAPP);
    console.log('📧 Attempting Email to:', booking.email, 'and', process.env.ADMIN_EMAIL);

    Promise.all([
      sendWhatsAppTwilio({
        to: process.env.ADMIN_WHATSAPP,
        message
      }).then(result => {
        console.log('✅ WhatsApp sent successfully:', result.sid);
        return result;
      }).catch(err => {
        console.error('❌ WhatsApp notification failed:', err.message);
        throw err;
      }),
      
      sendCustomerBookingEmail(booking)
        .then(result => {
          console.log('✅ Customer email sent successfully');
          return result;
        })
        .catch(err => {
          console.error('❌ Customer email failed:', err.message);
          throw err;
        }),
      
      sendAdminBookingEmail(booking)
        .then(result => {
          console.log('✅ Admin email sent successfully');
          return result;
        })
        .catch(err => {
          console.error('❌ Admin email failed:', err.message);
          throw err;
        })
    ])
    .then(() => console.log('🎉 All notifications sent successfully'))
    .catch(err => console.error('⚠️ Some notifications failed:', err.message));

  } catch (err) {
    console.error('❌ Notification error:', err.message);
  }
};

// ✅ FIXED: Use existing booking instead of creating new one
export const createCheckoutSession = async (req, res, next) => {
  try {
    if (!req.body) return res.status(400).json({
      success: false,
      message: 'Missing Request Key'
    })

    const {
      bookingId, // ✅ CRITICAL: Get existing booking ID from request
      userId,
      customer,
      email,
      phone,
      car,        
      pickupDate,
      returnDate,
      amount,  
      details,  
      address,    
      carImage,  
    } = req.body;

    console.log('💳 Creating checkout session...');
    console.log('💳 Booking ID:', bookingId);

    // Minimal validation
    const total = Number(amount);
    if (!total || Number.isNaN(total) || total <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }
    if (!pickupDate || !returnDate) {
      return res.status(400).json({ success: false, message: "pickupDate and returnDate required" });
    }

    const pd = new Date(pickupDate);
    const rd = new Date(returnDate);
    if (Number.isNaN(pd.getTime()) || Number.isNaN(rd.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid dates" });
    }
    if (rd < pd) {
      return res.status(400).json({ success: false, message: "returnDate must be same or after pickupDate" });
    }

    let carField = car;
    if (typeof car === 'string') {
      try { carField = JSON.parse(car); }
      catch { carField = { name: car }; }
    }

    // ✅ CRITICAL FIX: Use existing booking if bookingId provided
    let booking;
    
    if (bookingId) {
      console.log('✅ Using existing booking:', bookingId);
      booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // ✅ Check if payment already completed
      if (booking.paymentStatus === 'paid') {
        console.log('⚠️ Booking already paid - returning existing session');
        
        // If session exists, return it
        if (booking.sessionId && booking.stripeSession?.url) {
          return res.json({
            success: true,
            id: booking.sessionId,
            url: booking.stripeSession.url,
            bookingId: booking._id,
            _alreadyPaid: true
          });
        }
      }

      console.log('✅ Booking found, creating Stripe session...');
    } else {
      // ✅ FALLBACK: Only create booking if no bookingId provided (legacy support)
      console.log('⚠️ No bookingId provided - creating new booking (legacy mode)');
      
      booking = await Booking.create({
        userId: userId,
        customer: String(customer ?? ""),
        email: String(email ?? ""),
        phone: String(phone ?? ""),
        car: carField ?? {},
        carImage: String(carImage ?? ""),
        pickupDate: pd,
        returnDate: rd,
        amount: total,
        paymentStatus: "pending",
        details: typeof details === "string" ? JSON.parse(details) : (details || {}),
        address: typeof address === "string" ? JSON.parse(address) : (address || {}),
        status: "pending",
      });
      
      console.log('✅ New booking created:', booking._id);
    }

    let stripe;
    try { 
      stripe = getStripe(); 
    } catch (err) {
      // Only delete if we just created it
      if (!bookingId) {
        await Booking.findByIdAndDelete(booking._id).catch(() => { });
      }
      return res.status(500).json({
        success: false,
        message: 'Payment not configured', 
        error: err.message
      });
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email || undefined,
        line_items: [
          {
            price_data: {
              currency: "kes",
              product_data: {
                name: (carField && (carField.make || carField.name || carField.title)) || "Car Rental",
                description: `Rental ${pickupDate} → ${returnDate}`,
              },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
        cancel_url: `${CLIENT_URL}/cancel?payment_status=cancel`,
        metadata: {
          bookingId: booking._id.toString(),
          userId: String(userId ?? ""),
          carId: String((carField && (carField.id || carField._id)) || ""),
          pickupDate: String(pickupDate || ""),
          returnDate: String(returnDate || ""),
        },
      });
      
      console.log('✅ Stripe session created:', session.id);
    } catch (stripeErr) {
      // Only delete if we just created it
      if (!bookingId) {
        await Booking.findByIdAndDelete(booking._id).catch(() => { });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create Stripe Checkout Session',
        error: stripeErr.message || String(stripeErr)
      });
    }

    // Update booking with session info
    booking.sessionId = session.id;
    booking.stripeSession = {
      id: session.id,
      url: session.url || null
    };
    await booking.save();

    console.log('✅ Checkout session created successfully');

    return res.json({
      success: true,
      id: session.id,
      url: session.url,
      bookingId: booking._id
    });
  } catch (err) {
    console.error('❌ CheckoutSession Error', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server Error'
    });
  }
}

// SUCCESSFUL PAYMENT VERIFICATION
export const confirmPayment = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, message: 'Session_id required'});
    }

    let stripe;
    try {
      stripe = getStripe();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Payment not configured',
        error: err.message
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. status=${session.payment_status}`,
        session
      });
    }

    const bookingId = session.metadata?.bookingId;
    let order = null;

    if (bookingId) {
      order = await Booking.findByIdAndUpdate(
        bookingId, 
        {
          paymentStatus: 'paid',
          status: 'active',
          paymentIntentId: session.payment_intent || '',
          paymentDetails: {
            amount_total: session.amount_total || null,
            currency: session.currency || null
          },
        }, 
        { new: true }
      );
    }

    if (!order) {
      order = await Booking.findOneAndUpdate(
        {sessionId: session_id}, 
        {
          paymentStatus: 'paid',
          status: 'active',
          paymentIntentId: session.payment_intent || '',
          paymentDetails: {
            amount_total: session.amount_total || null,
            currency: session.currency || null
          },
        }, 
        { new: true }
      );
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found for this session', 
        session
      });
    }

    console.log('✅ Payment confirmed successfully');
    
    res.json({ success: true, order });

    console.log('📤 Payment confirmed, queuing notifications...');
    setImmediate(() => {
      console.log('🔔 setImmediate triggered, sending notifications now...');
      sendBookingNotifications(order);
    });

  } catch (err) {
    console.error('❌ Confirm Payment Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server Error'
    });
  }
}