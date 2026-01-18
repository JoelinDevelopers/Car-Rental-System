import Car from "../models/carModel.js";
import cloudinary from "../config/cloudinary.js";

// CREATE CAR with Cloudinary
export const createCar = async (req, res, next) => {
  try {
    console.log('📥 Creating car...');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const {
      make, model, dailyRate, category, description,
      year, color, seats, transmission, fuelType, mileage, status
    } = req.body;

    if (!make || !model || !dailyRate) {
      return res.status(400).json({
        success: false,
        message: 'Make, model and dailyRate are required.'
      });
    }

    // Handle image from Cloudinary upload
    let imageUrl = '';
    let cloudinaryId = '';
    
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
      cloudinaryId = req.file.filename; // Cloudinary public_id
      console.log('✅ Image uploaded to Cloudinary:', imageUrl);
    }

    // Create car document
    const car = new Car({
      make,
      model,
      year: year ? Number(year) : undefined,
      color: color || '',
      category: category || 'Sedan',
      seats: seats ? Number(seats) : 4,
      transmission: transmission || 'Automatic',
      fuelType: fuelType || 'Gasoline',
      mileage: mileage ? Number(mileage) : 0,
      dailyRate: Number(dailyRate),
      status: status || 'available',
      image: imageUrl,
      cloudinaryId: cloudinaryId,
      description: description || ''
    });

    const saved = await car.save();
    console.log('✅ Car saved to database:', saved._id);

    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: saved
    });
  } catch (err) {
    console.error('❌ Error creating car:', err);
    
    // Cleanup uploaded image if car creation failed
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
        console.log('🗑️ Cleaned up uploaded image');
      } catch (cleanupError) {
        console.error('Failed to cleanup:', cleanupError);
      }
    }
    
    next(err);
  }
};

// FETCH CARS - Updated to support fetching all cars
export const getCars = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    // Allow limit to be very large or fetch all if limit is not provided
    const limit = req.query.limit ? Number(req.query.limit) : 1000;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || '';

    const query = {};
    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const total = await Car.countDocuments(query);
    const cars = await Car.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const carsWithAvailability = cars.map(c => {
      const plain = c.toObject ? c.toObject() : c;
      if (c.getAvailabilitySummary) {
        plain.availability = c.getAvailabilitySummary();
      }
      return plain;
    });

    res.json({
      success: true,
      page,
      pages: Math.ceil(total / limit),
      total,
      data: carsWithAvailability
    });
  } catch (err) {
    next(err);
  }
};

// GET CAR BY ID
export const getCarById = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ 
        success: false,
        message: 'Car not found' 
      });
    }

    const plain = car.toObject();
    if (car.getAvailabilitySummary) {
      plain.availability = car.getAvailabilitySummary();
    }
    
    res.json({
      success: true,
      data: plain
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE CAR with Cloudinary
export const updateCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ 
        success: false,
        message: 'Car not found' 
      });
    }

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (car.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(car.cloudinaryId);
          console.log('🗑️ Old image deleted from Cloudinary');
        } catch (err) {
          console.warn('Failed to delete old image:', err);
        }
      }
      
      car.image = req.file.path;
      car.cloudinaryId = req.file.filename;
      console.log('✅ New image uploaded:', req.file.path);
    }

    // Handle image removal
    else if (req.body.image === '' && car.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(car.cloudinaryId);
        console.log('🗑️ Image removed from Cloudinary');
      } catch (err) {
        console.warn('Failed to delete image:', err);
      }
      car.image = '';
      car.cloudinaryId = '';
    }

    // Update other fields
    const fields = [
      'make', 'model', 'year', 'color', 'category', 
      'seats', 'transmission', 'fuelType', 'mileage', 
      'dailyRate', 'status', 'description'
    ];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (['year', 'seats', 'mileage', 'dailyRate'].includes(f)) {
          car[f] = Number(req.body[f]);
        } else {
          car[f] = req.body[f];
        }
      }
    });

    const updated = await car.save();
    
    res.json({
      success: true,
      message: 'Car updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// DELETE CAR with Cloudinary cleanup
export const deleteCar = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ 
        success: false,
        message: 'Car not found' 
      });
    }

    // Delete image from Cloudinary if exists
    if (car.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(car.cloudinaryId);
        console.log('🗑️ Image deleted from Cloudinary');
      } catch (err) {
        console.warn('Failed to delete image:', err);
      }
    }

    await Car.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Car deleted successfully!'
    });
  } catch (err) {
    next(err);
  }
};