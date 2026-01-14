import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug - Check if credentials are loaded (remove in production)
console.log('🔧 Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '❌ MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ MISSING',
});

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'car-rentals',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Optional: resize images automatically
    transformation: [{ width: 1200, height: 800, crop: 'limit' }],
  },
});

// Create multer upload middleware
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed!'), false);
      return;
    }
    cb(null, true);
  },
});

export default cloudinary;
 