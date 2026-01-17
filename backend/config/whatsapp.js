import twilio from "twilio";

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);

// Verify Twilio configuration on startup
const verifyTwilioConfig = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn("⚠️ Twilio credentials not configured");
    return false;
  }
  console.log("✅ Twilio WhatsApp is configured");
  return true;
};

verifyTwilioConfig();

export const sendWhatsAppTwilio = async ({ to, message }) => {
  try {
    // Ensure the number is in the correct format
    const formattedTo = to.startsWith('+') ? to : `+${to}`;
    const formattedFrom = process.env.TWILIO_WHATSAPP_NUMBER.startsWith('+') 
      ? process.env.TWILIO_WHATSAPP_NUMBER 
      : `+${process.env.TWILIO_WHATSAPP_NUMBER}`;
    
    const msg = await client.messages.create({
      from: `whatsapp:${formattedFrom}`,
      to: `whatsapp:${formattedTo}`,
      body: message
    });
    
    console.log("✅ WhatsApp message sent with SID:", msg.sid);
    return msg;
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error.message);
    
    // Log specific error details for debugging
    if (error.code) {
      console.error(`Twilio Error Code: ${error.code}`);
    }
    if (error.moreInfo) {
      console.error(`More info: ${error.moreInfo}`);
    }
    
    throw error;
  }
};

// Optional: Function to send formatted booking notification
export const sendBookingWhatsAppNotification = async (booking) => {
  const message = `
🚗 *NEW BOOKING ALERT*

👤 *Customer:* ${booking.customer}
📧 *Email:* ${booking.email}
📱 *Phone:* ${booking.phone || 'N/A'}

🚘 *Car:* ${booking.car.make} ${booking.car.model} (${booking.car.year})
📅 *Pickup:* ${booking.pickupDate.toDateString()}
📅 *Return:* ${booking.returnDate.toDateString()}
💰 *Amount:* Kes ${booking.amount.toLocaleString()}
📊 *Status:* ${booking.status}

🔗 *Booking ID:* ${booking._id}
  `.trim();

  return sendWhatsAppTwilio({
    to: process.env.ADMIN_WHATSAPP,
    message
  });
};