import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
    try {
        const dbConnection = await mongoose.connect(`${process.env.DB_CONNECTION}/${DB_NAME}`);
        console.log(`db conection success : Db Host Name : ${dbConnection.connection.host}`)
    } catch (error) {
        console.log('MongoDb connection Error:', error);
        process.exit(1);
        // throw error
    }
}