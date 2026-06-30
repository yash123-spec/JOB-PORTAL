// One-time script to create (or upgrade) an admin account with email/password login.
//
// Usage (run from the Backend folder):
//   node scripts/createAdmin.js <email> <password> "<Full Name>"
//
// Example:
//   node scripts/createAdmin.js admin@example.com MyStrongPass123 "Site Admin"
//
// If a user with that email already exists, it is upgraded to a local admin
// (role=admin, authProvider=local) and its password is reset to the one provided.

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/user.model.js";

// Resolve Backend/.env relative to THIS file, so it works from any working dir.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdmin() {
    const [, , email, password, ...nameParts] = process.argv;
    const fullname = nameParts.join(" ").trim() || "Administrator";

    if (!email || !password) {
        console.error('❌ Usage: node scripts/createAdmin.js <email> <password> "<Full Name>"');
        process.exit(1);
    }
    if (password.length < 6) {
        console.error("❌ Password must be at least 6 characters.");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected");

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            console.log(`ℹ️  User already exists — upgrading to local admin.`);
            user.role = "admin";
            user.authProvider = "local";
            user.providerId = null;
            user.accountStatus = "approved";
            user.emailVerified = true;
            user.isActive = true;
            user.password = password; // hashed by the model's pre-save hook
            user.fullname = fullname;
            await user.save();
        } else {
            console.log("➕ Creating new admin user...");
            user = await User.create({
                fullname,
                email: normalizedEmail,
                password, // hashed by the model's pre-save hook
                role: "admin",
                authProvider: "local",
                emailVerified: true,
                accountStatus: "approved",
                isActive: true,
            });
        }

        console.log("\n✅ Admin ready:");
        console.log(`   Name:  ${user.fullname}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role:  ${user.role}`);
        console.log("\nYou can now log in to the Admin Panel with this email and password.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to create admin:", error.message);
        process.exit(1);
    }
}

createAdmin();
