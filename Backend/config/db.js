import mongoose from "mongoose";


const connectDB = async ()=>{
try {
    const conn = await mongoose.connect(`${process.env.MONGODB_URI}`)
    console.log(`MongoDB Connection Successfull!! DB HOST: ${conn.connection.host}`)
} catch (error) {
    console.log(`Failed to connect:${error.message}`)
    process.exit(1)
}

}

export default connectDB