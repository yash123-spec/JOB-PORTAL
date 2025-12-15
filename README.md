# First Choice - Job Portal

A full-stack MERN job portal application with OAuth authentication, real-time messaging, and admin approval workflow for recruiters.

## 🚀 Features

### Authentication & Authorization

- **Multi-Provider OAuth** - Google OAuth for candidate registration
- **Email/Password Authentication** - For recruiter accounts with OTP verification
- **JWT-based Sessions** - Secure authentication with httpOnly cookies
- **Role-Based Access Control** - Three user roles: Candidate, Recruiter, Admin

### For Candidates

- Browse and search jobs with advanced filters
- Apply for jobs with resume upload
- Bookmark favorite jobs
- Track application status
- Real-time notifications
- Real-time messaging with recruiters
- Profile management with photo upload

### For Recruiters

- Register with OTP verification (admin approval required)
- Post and manage job listings
- View applicant resumes and details
- Manage applications
- Real-time communication with candidates
- Recruiter dashboard

### For Admins

- Approve/reject recruiter registrations
- Monitor platform activity
- User management
- Admin dashboard with analytics

### Technical Features

- **Real-time Notifications** - Instant updates for applications and messages
- **Real-time Messaging** - WebSocket-based chat system
- **File Upload** - Resume and profile picture upload via Cloudinary
- **Email Integration** - OTP verification via Nodemailer
- **Responsive UI** - Skillshare-inspired modern design
- **Protected Routes** - Frontend and backend route protection
- **Error Handling** - Comprehensive error handling and validation

## 🛠️ Tech Stack

### Frontend

- **React** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Moment.js** - Date formatting

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Passport.js** - OAuth strategies (Google, Apple)
- **Bcrypt.js** - Password hashing
- **Nodemailer** - Email service
- **Cloudinary** - File storage
- **Multer** - File upload middleware

## 📁 Project Structure

```
JOB PORTAL/
├── Backend/
│   ├── config/          # Database, Passport, Cloudinary config
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Auth, file upload, role authorization
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── .env.example     # Environment variables template
│   └── server.js        # Entry point
│
└── Frontend/Frontend/
    ├── public/          # Static assets
    ├── src/
    │   ├── Components/  # Reusable components
    │   ├── Pages/       # Page components
    │   ├── context/     # React Context (Auth)
    │   ├── data/        # Static data
    │   ├── utils/       # API utilities
    │   └── main.jsx     # Entry point
    └── index.html

```

## 🚦 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB Atlas account
- Cloudinary account
- Google OAuth credentials
- Gmail account for email service

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yash123-spec/JOB-PORTAL.git
cd JOB-PORTAL
```

2. **Backend Setup**

```bash
cd Backend
npm install
```

Create `.env` file based on `.env.example`:

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

3. **Frontend Setup**

```bash
cd Frontend/Frontend
npm install
```

Create `.env` file:

```env
VITE_REACT_APP_BACKEND_BASEURL=http://localhost:8000
```

### Running the Application

1. **Start Backend** (from Backend folder)

```bash
npm run start
```

Server runs on http://localhost:8000

2. **Start Frontend** (from Frontend/Frontend folder)

```bash
npm run dev
```

App runs on http://localhost:5173

## 🔑 Key Features Explained

### OAuth Flow

1. Candidate clicks "Continue with Google"
2. Redirects to Google authentication
3. Returns with user data
4. Auto-approved account created
5. JWT tokens set in httpOnly cookies

### Recruiter Registration Flow

1. Recruiter fills registration form
2. OTP sent to email via Nodemailer
3. Email and OTP verified
4. Account created with `pending` status
5. Admin approves/rejects from dashboard
6. Email notification sent on approval
7. Recruiter can login after approval

### Job Application Flow

1. Candidate browses jobs
2. Applies with uploaded resume
3. Real-time notification sent to recruiter
4. Recruiter views application in dashboard
5. Candidate tracks application status

## 🔒 Security Features

- Password hashing with bcrypt
- JWT tokens in httpOnly cookies
- CORS configuration
- Input validation and sanitization
- Protected API routes with middleware
- Role-based authorization
- OTP verification for sensitive operations
- Secure file upload validation

## 📊 Database Models

- **User** - Authentication, profiles, roles
- **Job** - Job postings with details
- **Application** - Job applications with resumes
- **OTP** - Email verification codes
- **RecruiterApproval** - Admin approval workflow
- **Notification** - Real-time notifications
- **Message** - Real-time messaging
- **AuditLog** - Activity tracking

## 🎨 UI Highlights

- Skillshare-inspired two-panel auth design
- Responsive navbar with role-based navigation
- Modern job cards with company logos
- Category-based job browsing
- Professional dashboard layouts
- Real-time notification dropdown
- Interactive profile management

## 📝 API Endpoints

### Authentication

- `POST /api/auth/recruiter/register` - Recruiter registration
- `POST /api/auth/recruiter/verify-otp` - OTP verification
- `GET /api/auth/google` - Google OAuth
- `POST /api/v1/user/login` - Email/password login
- `POST /api/v1/user/logout` - Logout

### Jobs

- `GET /api/v1/jobs` - Get all jobs (with filters)
- `GET /api/v1/jobs/:id` - Get job details
- `POST /api/v1/jobs` - Create job (recruiter)
- `PUT /api/v1/jobs/:id` - Update job (recruiter)
- `DELETE /api/v1/jobs/:id` - Delete job (recruiter)

### Applications

- `POST /api/v1/jobs/:id/apply` - Apply for job
- `GET /api/v1/applications` - Get user applications
- `GET /api/v1/jobs/:id/applications` - Get job applications (recruiter)

### Admin

- `GET /api/admin/recruiters/pending` - Pending recruiters
- `PUT /api/admin/recruiters/:id/approve` - Approve recruiter
- `PUT /api/admin/recruiters/:id/reject` - Reject recruiter

## 🚧 Known Issues

- OAuth login redirect flow has a minor bug (registration works perfectly)
- Forgot Password feature is placeholder
- Apple OAuth not configured

## 🔮 Future Enhancements

- Password reset functionality
- Advanced job recommendations
- Company profile pages
- Analytics dashboard
- Job alerts via email
- Application tracking with status updates
- Video interview integration

## 👨‍💻 Author

**Yash Thakkar**

- GitHub: [@yash123-spec](https://github.com/yash123-spec)
- Email: yashthakkar2411200398@gmail.com

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Skillshare for design inspiration
- MongoDB for database hosting
- Cloudinary for file storage
- Google for OAuth services

---

⭐ Star this repository if you find it helpful!
