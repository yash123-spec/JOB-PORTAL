import mongoose from "mongoose";

// On serverless (Vercel), the same process can handle many requests. Without
// caching, every cold start opened a brand-new DB connection (slow, and could
// exhaust the connection pool). We cache the connection on `global` so warm
// invocations instantly reuse the existing one instead of reconnecting.
let cached = global._mongoose;
if (!cached) {
    cached = global._mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // Already connected — reuse it, no new connection, no wait.
    if (cached.conn) return cached.conn;

    // A connection attempt is already in flight — wait for that same one
    // instead of starting a second (de-dupes concurrent requests).
    if (!cached.promise) {
        cached.promise = mongoose
            .connect(`${process.env.MONGODB_URI}`, {
                // Fail fast instead of hanging if the DB is unreachable
                serverSelectionTimeoutMS: 10000,
            })
            .then((mongooseInstance) => {
                console.log(`MongoDB Connection Successful!! DB HOST: ${mongooseInstance.connection.host}`);
                return mongooseInstance;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        // Reset so the NEXT request can retry, instead of crashing the whole
        // function with process.exit (which would kill the serverless instance).
        cached.promise = null;
        console.log(`Failed to connect: ${error.message}`);
        throw error;
    }

    return cached.conn;
};

export default connectDB;
