import express from "express";
import authMiddleware from "../middlewares/auth.js";
import {
  createBooking,
  deleteBooking,
  getBookings,
  getMyBookings,
  updateBooking,
  updateBookingStatus,
} from "../controllers/bookingController.js";
import upload from "../middlewares/uploads.js"; // ✅ default import

const bookingRouter = express.Router();

// Create booking with image upload
bookingRouter.post(
  "/",
  authMiddleware,
  upload.single("carImage"), // ✅ FIXED
  createBooking
);

bookingRouter.get("/", getBookings);

bookingRouter.get("/mybooking", authMiddleware, getMyBookings);

// Update booking with image upload
bookingRouter.put("/:id", upload.single("carImage"), updateBooking);

bookingRouter.patch("/:id/status", updateBookingStatus);

bookingRouter.delete("/:id", deleteBooking);

export default bookingRouter;
