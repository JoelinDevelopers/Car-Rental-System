import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import carRouter from "./routes/carRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

/* -------------------- dirname fix -------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------- DB (SAFE) -------------------- */
try {
  await connectDB();
} catch (err) {
  console.error("Database connection failed:", err);
}

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "https://car-rental-system-374x.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false); // never throw on Vercel
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

/* -------------------- Middleware -------------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ⚠️ uploads NOTE:
   Vercel filesystem is read-only.
   Use Cloudinary / S3 for production.
*/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------------------- Routes -------------------- */
app.use("/api/auth", userRouter);
app.use("/api/cars", carRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);

app.get("/api/ping", (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.get("/", (req, res) => {
  res.send("API WORKING");
});

/* 🚀 REQUIRED FOR VERCEL */
export default app;
