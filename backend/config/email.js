import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

export const sendCustomerBookingEmail = async (booking) => {
  try {
    const info = await transporter.sendMail({
      from: `"Aurum Drive" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: "🚗 Booking Confirmation – Aurum Drive",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Booking Confirmed! 🎉</h2>
          <p>Hello <strong>${booking.customer}</strong>,</p>
          <p>Your booking has been successfully created and is pending confirmation.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;"><b>Car:</b> ${booking.car.make} ${booking.car.model} (${booking.car.year})</li>
              <li style="padding: 8px 0;"><b>Pickup Date:</b> ${booking.pickupDate.toDateString()}</li>
              <li style="padding: 8px 0;"><b>Return Date:</b> ${booking.returnDate.toDateString()}</li>
              <li style="padding: 8px 0;"><b>Amount:</b> <strong>Kes ${booking.amount.toLocaleString()}</strong></li>
              <li style="padding: 8px 0;"><b>Status:</b> <span style="color: #f39c12;">${booking.status}</span></li>
            </ul>
          </div>
          
          <p>We'll contact you shortly to confirm your booking.</p>
          <p style="color: #7f8c8d; font-size: 14px;">If you have any questions, please don't hesitate to contact us.</p>
          
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
          <p style="color: #95a5a6; font-size: 12px;">
            Best regards,<br>
            <strong>Aurum Drive Team</strong>
          </p>
        </div>
      `
    });
    
    console.log("✅ Customer email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send customer email:", error.message);
    throw error;
  }
};

export const sendAdminBookingEmail = async (booking) => {
  try {
    const info = await transporter.sendMail({
      from: `"Aurum Drive System" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "📢 New Booking Alert – Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">🚨 New Booking Received</h2>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <strong>Action Required:</strong> Review and confirm this booking.
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Information:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;"><b>Name:</b> ${booking.customer}</li>
              <li style="padding: 8px 0;"><b>Email:</b> <a href="mailto:${booking.email}">${booking.email}</a></li>
              <li style="padding: 8px 0;"><b>Phone:</b> <a href="tel:${booking.phone}">${booking.phone}</a></li>
            </ul>
            
            <h3>Booking Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;"><b>Car:</b> ${booking.car.make} ${booking.car.model} (${booking.car.year})</li>
              <li style="padding: 8px 0;"><b>Pickup:</b> ${booking.pickupDate.toDateString()}</li>
              <li style="padding: 8px 0;"><b>Return:</b> ${booking.returnDate.toDateString()}</li>
              <li style="padding: 8px 0;"><b>Amount:</b> <strong>Kes ${booking.amount.toLocaleString()}</strong></li>
              <li style="padding: 8px 0;"><b>Booking ID:</b> ${booking._id}</li>
            </ul>
          </div>
          
          ${booking.address ? `
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Delivery Address:</h4>
            <p>${JSON.stringify(booking.address, null, 2)}</p>
          </div>
          ` : ''}
          
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
            Please log in to the admin dashboard to manage this booking.
          </p>
        </div>
      `
    });
    
    console.log("✅ Admin email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send admin email:", error.message);
    throw error;
  }
};