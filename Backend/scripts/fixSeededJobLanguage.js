// One-off fix: rewrite the (Latin lorem) responsibilities of already-seeded jobs
// into English. Targets only jobs created by seeded recruiters
// (emails matching recruiter.seed.*@example.com). Safe to run multiple times.
//
// Usage (from the Backend folder):
//   node scripts/fixSeededJobLanguage.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

const DESCRIPTIONS = [
  "We are looking for a dedicated professional to join our team and help drive our projects forward. You will collaborate with cross-functional teams to deliver high-quality results in a fast-paced environment.",
  "Join our growing company where you will play a key role in shaping our products and services. This position offers the opportunity to work on challenging problems alongside a supportive and experienced team.",
  "This is an exciting opportunity for an ambitious individual to make a real impact. You will be responsible for delivering excellent outcomes while growing your skills and advancing your career.",
  "We are hiring a passionate team member who thrives in a collaborative environment. You will contribute to meaningful work that directly benefits our customers and stakeholders.",
  "As part of our team, you will help us build innovative solutions and improve existing processes. We value creativity, ownership, and a strong commitment to quality.",
  "We are seeking a motivated professional who is eager to learn and take on new challenges. You will work on impactful initiatives that support our long-term goals and mission.",
];

const RESPONSIBILITIES = [
  "Collaborate with team members to plan, execute, and deliver projects on time.",
  "Communicate effectively with stakeholders to understand requirements and provide updates.",
  "Identify opportunities for improvement and propose practical solutions.",
  "Maintain high standards of quality across all deliverables.",
  "Document processes, decisions, and outcomes clearly and consistently.",
  "Support the team in day-to-day operations and problem-solving.",
  "Analyze data and information to inform decisions and drive results.",
  "Contribute to a positive, inclusive, and productive work environment.",
  "Manage multiple priorities while meeting deadlines and goals.",
  "Stay up to date with industry trends and best practices.",
  "Work closely with clients to ensure their needs are met and expectations exceeded.",
  "Take ownership of assigned tasks and see them through to completion.",
];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  }
  return out;
};

const buildResponsibilities = () => [pick(DESCRIPTIONS), ...pickN(RESPONSIBILITIES, randInt(3, 5))];

async function run() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in Backend/.env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected");

    // Find all seeded recruiters by their identifiable email.
    const seededRecruiters = await User.find(
      { email: /^recruiter\.seed\./ },
      { _id: 1 }
    ).lean();
    const ids = seededRecruiters.map((u) => u._id);
    console.log(`Found ${ids.length} seeded recruiters.`);

    const jobs = await Job.find({ createdBy: { $in: ids } }, { _id: 1 }).lean();
    console.log(`Found ${jobs.length} seeded jobs to update.`);

    let updated = 0;
    for (const job of jobs) {
      await Job.updateOne(
        { _id: job._id },
        { $set: { responsibilities: buildResponsibilities() } }
      );
      updated++;
      if (updated % 50 === 0) console.log(`  ...${updated}/${jobs.length}`);
    }

    console.log(`\n✅ Updated ${updated} jobs to English content.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

run();
