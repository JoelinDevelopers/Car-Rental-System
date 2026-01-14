import express from 'express';
import { 
  createCar, 
  getCars, 
  getCarById, 
  updateCar, 
  deleteCar 
} from '../controllers/carController.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Routes with Cloudinary upload middleware
router.post('/', upload.single('image'), createCar);
router.get('/', getCars);
router.get('/:id', getCarById);
router.put('/:id', upload.single('image'), updateCar);
router.delete('/:id', deleteCar);

export default router;