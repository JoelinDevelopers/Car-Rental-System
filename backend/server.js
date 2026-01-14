// 🔥 MUST be first – loads .env before ANY other imports
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoutes.js';
import carRouter from './routes/carRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔌 Database
connectDB();

// 🧱 Middlewares
app.use(cors());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 Static uploads
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

// 🚏 Routes
app.use('/api/auth', userRouter);
app.use('/api/cars', carRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/payments', paymentRouter);

// 🩺 Health check
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// Root
app.get('/', (req, res) => {
  res.send('API WORKING');
});

// ❌ 404 handler - must come after all routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// 🚨 Global error handler - must come last
app.use((err, req, res, next) => {
  console.error('🔥 ERROR CAUGHT:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`);
});