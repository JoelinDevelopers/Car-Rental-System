import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import carRouter from "./routes/carRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

/* -------------------- DB INIT -------------------- */
const initDB = async () => {
  try {
    await connectDB();
    console.log("DB connected");
  } catch (err) {
    console.error("DB error:", err.message);
  }
};
initDB();

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "https://car-rental-system-374x.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(null, false);
    },
    credentials: true,
  })
);

app.options("*", cors());

/* -------------------- Middleware -------------------- */
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- Routes -------------------- */
app.use("/api/auth", userRouter);
app.use("/api/cars", carRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);

app.get("/api/ping", (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.send("API WORKING");
});

/* 🚀 EXPORT ONLY */
export default app;
