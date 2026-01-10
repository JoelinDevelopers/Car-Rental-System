import mongoose from "mongoose";
import Car from "./carModel.js";

const { Schema } = mongoose;

/* -------------------- Sub Schemas -------------------- */

const addressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  { _id: false, default: {} }
);

const carSummarySchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: "Car", required: true },
    make: { type: String, default: "" },
    model: { type: String, default: "" },
    year: Number,
    dailyRate: { type: Number, default: 0 },
    category: { type: String, default: "Sedan" },
    seats: { type: Number, default: 4 },
    transmission: { type: String, default: "" },
    fuelType: { type: String, default: "" },
    mileage: { type: Number, default: 0 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    car: { type: carSummarySchema, required: true },
    carImage: { type: String, default: "" },
    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    bookingDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled", "upcoming"],
      default: "pending",
    },
    amount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    paymentMethod: { type: String, enum: ["Credit Card", "Paypal"], default: "Credit Card" },
    sessionId: String,
    paymentIntentId: String,
    address: { type: addressSchema, default: () => ({}) },
    stripeSession: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);


// /* -------------------- Indexes -------------------- */

// // Fast conflict lookups
// bookingSchema.index({ "car.id": 1, pickupDate: 1, returnDate: 1 });

// // Stripe idempotency
// bookingSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
// bookingSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true });

// /* -------------------- Constants -------------------- */

const BLOCKING_STATUSES = ["pending", "active", "upcoming"];

/* -------------------- Helpers -------------------- */

function datesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// /* -------------------- Pre Validate -------------------- */
// /* Populate car snapshot */

bookingSchema.pre("validate", async function () {
  if (!this.car?.id) return;

  const { make, model, dailyRate } = this.car;
  if (make || model || dailyRate) return;

  const carDoc = await Car.findById(this.car.id).lean();
  if (!carDoc) throw new Error("Car not found");

  Object.assign(this.car, {
    make: carDoc.make,
    model: carDoc.model,
    year: carDoc.year,
    dailyRate: carDoc.dailyRate,
    seats: carDoc.seats,
    transmission: carDoc.transmission,
    fuelType: carDoc.fuelType,
    mileage: carDoc.mileage,
    image: carDoc.image,
  });

  if (!this.carImage) this.carImage = carDoc.image || "";
});

/* -------------------- Pre Save -------------------- */
/* Date validation + conflict detection */

bookingSchema.pre("save", async function () {
  if (this.pickupDate >= this.returnDate) {
    throw new Error("Return date must be after pickup date");
  }

  if (!this.car?.id) return;

  const conflict = await mongoose.model("Booking").exists({
    _id: { $ne: this._id },
    "car.id": this.car.id,
    status: { $in: BLOCKING_STATUSES },
    pickupDate: { $lt: this.returnDate },
    returnDate: { $gt: this.pickupDate },
  });

  if (conflict) {
    throw new Error("Car is not available for the selected dates");
  }
});

/* -------------------- Post Save -------------------- */
/* Sync booking to Car.bookings (optimized) */

bookingSchema.post("save", async function (doc) {
  if (!doc.car?.id) return;

  const carId = doc.car.id;

  // Always remove old reference
  await Car.updateOne(
    { _id: carId },
    { $pull: { bookings: { bookingId: doc._id } } }
  );

  if (BLOCKING_STATUSES.includes(doc.status)) {
    await Car.updateOne(
      { _id: carId },
      {
        $push: {
          bookings: {
            bookingId: doc._id,
            pickupDate: doc.pickupDate,
            returnDate: doc.returnDate,
            status: doc.status,
          },
        },
      }
    );
  }
});

/* -------------------- Post Remove -------------------- */

bookingSchema.post("remove", async function (doc) {
  if (!doc.car?.id) return;

  await Car.updateOne(
    { _id: doc.car.id },
    { $pull: { bookings: { bookingId: doc._id } } }
  );
});

/* -------------------- Export -------------------- */

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
