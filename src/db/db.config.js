import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async()=>{
    try{
    const connectionString = await mongoose.connect(`${process.env.MONGO_URL}${DB_NAME}`)
    console.log(`MongoDB connected !! DB Host :${connectionString.connection.host}`)
}catch(error){
        console.log("Mongo db error:",error)
        process.exit(1)
    }

}

export default connectDB;