import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://japhethochuku5_db_user:Ochuku212354@cluster0.wgibbxt.mongodb.net/CarRental')
    .then(() => console.log('DB connected'))
}


