import mongoose from "mongoose";
import "dotenv/config"

export const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`)
        console.log(`\nMongoDB Connected !!`, connectionInstance.connection.host);
    } catch (error) {
        console.log("MONGODB CONNECTION FAILED❗", error)
        process.exit(1)
    }
}