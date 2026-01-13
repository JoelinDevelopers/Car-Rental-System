import express from "express";
import {
  createCar,
  deleteCar,
  getCarById,
  getCars,
  updateCar,
} from "../controllers/carController.js";
import upload from "../middlewares/uploads.js"; // ✅ default import

const carRouter = express.Router();

carRouter.get("/", getCars);
carRouter.get("/:id", getCarById);

// Create car (image upload)
carRouter.post("/", upload.single("image"), createCar);

// Update car (image upload)
carRouter.put("/:id", upload.single("image"), updateCar);

// Delete car
carRouter.delete("/:id", deleteCar);

export default carRouter;
