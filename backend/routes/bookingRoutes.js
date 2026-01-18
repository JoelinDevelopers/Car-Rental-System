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
import { upload } from "../config/cloudinary.js";

const bookingRouter = express.Router();

// Create booking with multiple file uploads (carImage, idPhoto, licensePhoto)
bookingRouter.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "carImage", maxCount: 1 },
    { name: "idPhoto", maxCount: 1 },
    { name: "licensePhoto", maxCount: 1 }
  ]),
  createBooking
);

bookingRouter.get("/", getBookings);
bookingRouter.get("/mybooking", authMiddleware, getMyBookings);

// Update booking with multiple file uploads
bookingRouter.put(
  "/:id",
  upload.fields([
    { name: "carImage", maxCount: 1 },
    { name: "idPhoto", maxCount: 1 },
    { name: "licensePhoto", maxCount: 1 }
  ]),
  updateBooking
);

bookingRouter.patch("/:id/status", updateBookingStatus);
bookingRouter.delete("/:id", deleteBooking);

export default bookingRouter;