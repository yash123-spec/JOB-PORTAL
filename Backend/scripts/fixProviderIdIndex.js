import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "../.env" });

const MONGODB_URI = process.env.MONGODB_URI;

async function fixProviderIdIndex() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        console.log("\n📋 Current indexes:");
        const indexes = await usersCollection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        // Drop the problematic providerId index
        console.log("\n🗑️  Dropping providerId_1 index...");
        try {
            await usersCollection.dropIndex('providerId_1');
            console.log("✅ Index dropped successfully");
        } catch (error) {
            if (error.code === 27) {
                console.log("⚠️  Index doesn't exist, skipping...");
            } else {
                throw error;
            }
        }

        // Create new unique index with partial filter (only non-null string values)
        console.log("\n🔧 Creating new unique index with partial filter...");
        await usersCollection.createIndex(
            { providerId: 1 },
            {
                unique: true,
                partialFilterExpression: {
                    providerId: { $type: "string" }
                }
            }
        );
        console.log("✅ New index created successfully");

        console.log("\n📋 Updated indexes:");
        const newIndexes = await usersCollection.indexes();
        console.log(JSON.stringify(newIndexes, null, 2));

        console.log("\n✅ Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

fixProviderIdIndex();
