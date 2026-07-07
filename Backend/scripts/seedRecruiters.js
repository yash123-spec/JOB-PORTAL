// Seeder: create 100 recruiters (with professional details) + 1-3 job posts each.
//
// Usage (run from the Backend folder):
//   npm run seed:recruiters
//   -- or --
//   node scripts/seedRecruiters.js
//
// Behaviour:
//   - APPEND ONLY: never deletes existing data.
//   - Each recruiter is a User (role=recruiter, accountStatus=approved, emailVerified)
//     PLUS a matching RecruiterApproval doc holding companyName/companyWebsite/designation.
//   - Every run uses a fresh batch tag in the email so re-runs never collide.
//   - Seeded users have identifiable emails: recruiter.seed.<batch>.<n>@example.com
//     and all share the password below, so they are easy to log in with / clean up later.

import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { User } from "../models/user.model.js";
import RecruiterApproval from "../models/recruiterApproval.model.js";
import { Job } from "../models/job.model.js";

// Resolve Backend/.env relative to THIS file, so it works from any working dir.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

// ----- Config -----
const RECRUITER_COUNT = 100;
const SEED_PASSWORD = "Password123";
const MIN_JOBS = 1;
const MAX_JOBS = 3;

const DESIGNATIONS = [
  "HR Manager",
  "Talent Acquisition Lead",
  "Technical Recruiter",
  "Hiring Manager",
  "People Operations Specialist",
  "Head of Talent",
];

const SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB",
  "SQL", "PostgreSQL", "Python", "Django", "Java", "Spring Boot",
  "AWS", "Docker", "Kubernetes", "GraphQL", "REST APIs", "Redux",
  "HTML", "CSS", "Tailwind CSS", "Git", "CI/CD", "Redis",
  "System Design", "Microservices", "Next.js", "Go", "Rust", "Figma",
];

const JOB_TYPES = ["on-site", "hybrid", "remote"];
const JOB_TIMES = ["full-time", "part-time"];

// English content for job descriptions (responsibilities[0] renders as "Description"
// in the UI) and responsibility bullet points. Kept generic so they fit any title.
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

// Build the responsibilities array: index 0 is the description paragraph,
// the rest are individual responsibility bullets.
const buildResponsibilities = () => [
  faker.helpers.arrayElement(DESCRIPTIONS),
  ...faker.helpers.arrayElements(RESPONSIBILITIES, randInt(3, 5)),
];

// pick a random integer in [min, max] inclusive
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// pick n distinct random items from an array
const sample = (arr, n) => faker.helpers.arrayElements(arr, n);

// Short unique-ish tag for this run so re-runs produce fresh emails.
const BATCH_TAG = Date.now().toString(36);

function buildJobsFor(user, companyName, companyWebsite) {
  const count = randInt(MIN_JOBS, MAX_JOBS);
  const jobs = [];

  for (let j = 0; j < count; j++) {
    const salaryMin = randInt(3, 15);
    const salaryMax = salaryMin + randInt(3, 20);

    jobs.push({
      title: faker.person.jobTitle(),
      responsibilities: buildResponsibilities(),
      skills: sample(SKILLS, randInt(3, 6)),
      company: companyName,
      companyWebsite,
      location: faker.location.city(),
      type: faker.helpers.arrayElement(JOB_TYPES),
      jobTime: faker.helpers.arrayElement(JOB_TIMES),
      salaryMin,
      salaryMax,
      salaryRange: `₹${salaryMin} - ₹${salaryMax} LPA`,
      createdBy: user._id,
    });
  }

  return jobs;
}

async function seed() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in Backend/.env");
    process.exit(1);
  }

  let recruitersCreated = 0;
  let approvalsCreated = 0;
  const allJobs = [];

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected");
    console.log(`Seeding ${RECRUITER_COUNT} recruiters (batch: ${BATCH_TAG})...`);

    for (let i = 1; i <= RECRUITER_COUNT; i++) {
      const fullname = faker.person.fullName();
      const email = `recruiter.seed.${BATCH_TAG}.${i}@example.com`.toLowerCase();

      const companyName = faker.company.name();
      const companyWebsite = faker.internet.url();
      const designation = faker.helpers.arrayElement(DESIGNATIONS);

      try {
        // User.create() runs the pre-save hook that hashes the password.
        const user = await User.create({
          fullname,
          email,
          password: SEED_PASSWORD,
          role: "recruiter",
          authProvider: "local",
          emailVerified: true,
          accountStatus: "approved",
          isActive: true,
        });
        recruitersCreated++;

        await RecruiterApproval.create({
          user: user._id,
          status: "approved",
          companyName,
          companyWebsite,
          designation,
          approvedAt: new Date(),
        });
        approvalsCreated++;

        allJobs.push(...buildJobsFor(user, companyName, companyWebsite));
      } catch (err) {
        if (err && err.code === 11000) {
          console.warn(`⚠️  Skipped duplicate recruiter (${email}): ${err.message}`);
          continue;
        }
        throw err;
      }

      if (i % 10 === 0) {
        console.log(`  ...${i}/${RECRUITER_COUNT} recruiters processed`);
      }
    }

    // Jobs have no hashing hook, so insertMany is safe and fast.
    const insertedJobs = allJobs.length ? await Job.insertMany(allJobs) : [];

    console.log("\n✅ Seeding complete:");
    console.log(`   Recruiters (User):        ${recruitersCreated}`);
    console.log(`   RecruiterApproval records: ${approvalsCreated}`);
    console.log(`   Jobs:                      ${insertedJobs.length}`);
    console.log(`\n   Login with any: recruiter.seed.${BATCH_TAG}.<1-${RECRUITER_COUNT}>@example.com`);
    console.log(`   Password:       ${SEED_PASSWORD}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seed();
