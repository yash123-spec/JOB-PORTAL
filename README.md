# firstChoice — Job Portal

A full-stack job portal where candidates can find jobs, recruiters can post them, and admins can keep everything in order. Built this as a personal project to get hands-on with a real-world application that has multiple user roles, background jobs, real-time features, and OAuth — all the things you'd actually deal with in production.

---

## What it does

There are three types of users in the system — **Candidates**, **Recruiters**, and **Admins** — and each one gets a different experience.

Candidates can browse job listings, apply, and get notified when something changes on their application. Recruiters can post jobs, manage their listings, and communicate with candidates through the built-in messaging feature. Admins have full oversight — they can manage users, moderate content, and keep the platform running clean.

Authentication works two ways: standard email/password with JWT, and Google OAuth via Passport.js. There was an interesting bug I had to fix here — mobile Safari was silently dropping httpOnly cookies during the OAuth redirect, which broke login on iOS. I ended up migrating to Bearer tokens stored in localStorage, with the token passed through the URL on the redirect callback. Not the most elegant solution on paper, but it works reliably across all browsers and devices.

---

## Tech Stack

**Frontend** — React (Vite), Axios, Context API for auth state, Socket.io client  
**Backend** — Node.js, Express.js, MongoDB with Mongoose  
**Auth** — JWT + Google OAuth (Passport.js)  
**Real-time** — Socket.io for instant messaging and notifications  
**Background Jobs** — BullMQ + Redis (used for things like sending emails, processing notifications)  
**File Storage** — Cloudinary (resume uploads, profile pictures)  
**Deployment** — Frontend on Vercel, Backend on Render, UptimeRobot for uptime pings

---

## Project Structure

```
firstChoice/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/         # AuthContext, etc.
│   │   └── api.js           # Axios instance with interceptors
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/          # Mongoose schemas
│   │   ├── middlewares/     # Auth, RBAC, error handling
│   │   ├── services/
│   │   ├── queues/          # BullMQ workers
│   │   └── sockets/         # Socket.io handlers
```

---



**Environment variables you'll need (backend)**

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173
```

---

## A few things worth mentioning

The RBAC setup is three-tier — every protected route checks not just whether you're logged in, but whether your role is allowed to do that specific thing. Recruiters can't access admin routes, candidates can't post jobs, etc.

For real-time, Socket.io handles both the messaging between users and the notification system (like when a recruiter views your application). Notifications are stored in the DB as well, so they persist across sessions.

BullMQ handles anything that doesn't need to happen synchronously — email delivery, notification processing, that sort of thing. It keeps the API response times fast and the work happens in the background.

---

## Live Demo

Frontend: https://first-choice-one.vercel.app. 
Backend: https://first-choice-8d20.onrender.com/.
Admin URL: https://first-choice-admin.vercel.app/

---

## Author

Built by **Yash Thakkar** — feel free to reach out if you have questions or want to talk about the implementation.
