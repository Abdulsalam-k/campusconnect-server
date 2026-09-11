# CampusConnect Backend 🚀

The CampusConnect backend is a RESTful API built with Node.js and Express that powers authentication, student profiles, opportunities, applications, notifications, role-based access control, password reset, cloud image storage, and transactional email.

It serves the React frontend deployed on Vercel and uses MongoDB Atlas for persistent data storage.

## 🌐 Production

**Backend API**

https://campusconnect-server-lcj4.onrender.com

**Frontend**

https://campusconnect-red-alpha.vercel.app

## ✨ Core Features

### Authentication

* User registration
* Secure login
* JWT authentication
* Protected routes
* Role-based authorization
* Account activation/deactivation
* Password reset
* One-time password reset tokens
* 15-minute password reset expiry

### Student Management

* Student profiles
* Education
* Department
* Location
* Skills
* Biography
* Profile images
* Cloudinary image storage
* Student directory

### Opportunities

* Create opportunities
* View opportunities
* View opportunity details
* Edit opportunities
* Delete opportunities
* Recruiter ownership protection
* Opportunity categories
* Opportunity types
* Remote, on-site and hybrid modes
* Skills associated with opportunities

### Applications

* Submit applications
* Prevent duplicate applications
* View personal applications
* Recruiter application management
* Accept applications
* Reject applications
* Application status notifications
* Recruiter email notifications
* Student status email notifications

### Notifications

* Create system notifications internally
* View personal notifications
* Unread notification counts
* Mark individual notifications as read
* Mark all notifications as read
* Delete personal notifications

### Administration

* Admin dashboard
* User management
* Role management
* Account activation/deactivation
* Application management
* Platform statistics
* Protected administrator endpoints

## 🛡️ Security

The backend includes multiple security layers:

* JWT authentication
* Role-based authorization
* Recruiter ownership verification
* Application ownership verification
* Notification ownership verification
* Secure password hashing with bcrypt
* Password reset tokens generated with cryptographically secure random bytes
* Password reset token hashing
* Password reset expiration
* Generic forgot-password responses to reduce account enumeration
* Helmet security headers
* Restricted CORS
* General API rate limiting
* Authentication-specific rate limiting
* Registration rate limiting
* JSON request-size limits
* Request input validation
* Mongoose schema validation
* Duplicate application protection
* ObjectId validation
* Profile image size validation
* Profile image MIME validation
* Profile image file-signature validation
* Environment-based secrets

## 🧰 Tech Stack

### Backend

* Node.js
* Express.js
* JavaScript
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Multer
* Cloudinary
* Brevo Transactional Email
* Helmet
* Express Rate Limit

### Infrastructure

* Render — API hosting
* MongoDB Atlas — Database
* Cloudinary — Image storage
* Brevo — Transactional email

## 🏗️ Architecture

```text
                         CampusConnect Frontend
                                  │
                                  │ HTTPS / REST API
                                  ▼
                       ┌─────────────────────┐
                       │   Express Backend   │
                       │       Render        │
                       └─────────┬───────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
      ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
      │ MongoDB Atlas│   │  Cloudinary  │   │    Brevo     │
      │   Database   │   │ Profile      │   │ Transactional│
      │              │   │ Images       │   │    Email     │
      └──────────────┘   └──────────────┘   └──────────────┘
```

## 📁 Project Structure

```text
campusconnect-server/
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── models/
│   │   ├── Application.js
│   │   ├── Notification.js
│   │   ├── Opportunity.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── authRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── opportunityRoutes.js
│   │   ├── recruiterRoutes.js
│   │   ├── savedOpportunityRoutes.js
│   │   └── studentRoutes.js
│   │
│   ├── utils/
│   │   ├── cloudinary.js
│   │   └── sendEmail.js
│   │
│   └── server.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🔐 Authentication Flow

```text
Client
  ↓
POST /api/auth/login
  ↓
Validate email + password
  ↓
bcrypt password comparison
  ↓
Generate JWT
  ↓
Return token
  ↓
Client sends:
Authorization: Bearer <token>
  ↓
protect middleware
  ↓
Verify token
  ↓
Attach userId + role to request
```

## 👥 Role-Based Authorization

CampusConnect supports three roles:

```text
student
recruiter
admin
```

The authorization flow is:

```text
JWT
 ↓
protect middleware
 ↓
Identify authenticated user
 ↓
authorizeRoles middleware
 ↓
Check required role
 ↓
Allow / Reject request
```

### Student

Students can:

* Manage their profiles
* Browse opportunities
* Save opportunities
* Apply for opportunities
* View their applications
* Manage their notifications

### Recruiter

Recruiters can:

* Create opportunities
* Edit their own opportunities
* Delete their own opportunities
* View applications for their opportunities
* Accept or reject applications

### Admin

Administrators can:

* Manage users
* Change user roles
* Activate/deactivate accounts
* View platform statistics
* View all applications
* Manage platform-level resources

## 🔑 Password Reset

The password-reset system uses a secure token workflow:

```text
Forgot password request
        ↓
Find user
        ↓
Generate random reset token
        ↓
Hash token with SHA-256
        ↓
Store token hash + expiry
        ↓
Send reset link with Brevo
        ↓
User opens reset link
        ↓
Backend hashes submitted token
        ↓
Compare with stored hash
        ↓
Check expiration
        ↓
Hash new password
        ↓
Clear reset token
        ↓
Password successfully changed
```

Reset tokens expire after 15 minutes and are invalidated after successful use.

## 📧 Transactional Email

CampusConnect uses **Brevo's transactional email API** rather than SMTP.

Emails include:

* Password reset messages
* New application notifications
* Application acceptance notifications
* Application rejection notifications

The API-based email architecture avoids dependency on outbound SMTP ports from the hosting environment.

## 🖼️ Image Upload Security

Profile images are processed using Multer and Cloudinary.

The backend:

1. Limits uploads to 2 MB
2. Accepts JPG, PNG and WebP
3. Checks the client-provided MIME type
4. Verifies the actual file signature
5. Uploads validated images to Cloudinary
6. Stores the secure Cloudinary URL
7. Removes the previous Cloudinary image after successful replacement

## 🔒 Environment Variables

Never commit real environment variables or API keys to GitHub.

Example backend configuration:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173
FRONTEND_APP_URL=http://localhost:5173

BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=your_verified_sender_email
BREVO_FROM_NAME=CampusConnect

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

For production, secrets are configured through Render environment variables.

## 🚀 Local Development

Clone the repository:

```bash
git clone https://github.com/Abdulsalam-k/campusconnect-server.git
cd campusconnect-server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file with the required environment variables.

Start the development server:

```bash
npm run dev
```

The API runs locally at:

```text
http://localhost:5000
```

## 📡 API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
GET  /api/auth/me
PUT  /api/auth/profile
DELETE /api/auth/profile-image
```

### Opportunities

```text
GET    /api/opportunities
GET    /api/opportunities/:id
POST   /api/opportunities
PUT    /api/opportunities/:id
DELETE /api/opportunities/:id
```

### Applications

```text
POST /api/applications
GET  /api/applications/my
GET  /api/applications
PUT  /api/applications/:id/status
```

### Saved Opportunities

```text
POST   /api/saved-opportunities/:opportunityId
DELETE /api/saved-opportunities/:opportunityId
GET    /api/saved-opportunities
```

### Notifications

```text
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
DELETE /api/notifications/:id
```

### Recruiter

```text
GET /api/recruiter/dashboard
GET /api/recruiter/applications/:id
```

### Administration

```text
GET /api/admin/dashboard
GET /api/admin/users
PUT /api/admin/users/:id/role
GET /api/admin/users/:id
PUT /api/admin/users/:id/status
```

### Health Check

```text
GET /api/health
```

## 🧪 Testing & Security Validation

The backend has been tested across major application flows including:

* Registration
* Login
* Logout/session restoration
* Password reset
* Profile updates
* Profile image upload
* Opportunity creation
* Opportunity editing
* Opportunity deletion
* Application submission
* Duplicate application prevention
* Application status updates
* Saved opportunities
* Notifications
* Recruiter authorization
* Admin authorization
* Production CORS
* Production API communication
* Transactional email delivery

Security hardening was tested locally before being deployed to production.

## 📊 Production Architecture

```text
Vercel
React Frontend
      │
      │ HTTPS
      ▼
Render
Express API
      │
      ├──────────────► MongoDB Atlas
      │
      ├──────────────► Cloudinary
      │
      └──────────────► Brevo
```

## 🎯 Purpose

CampusConnect was designed as a realistic full-stack platform demonstrating:

* REST API development
* Backend architecture
* Database modeling
* Authentication
* Authorization
* Role-based access control
* Cloud storage
* Transactional email
* Security hardening
* API design
* Production deployment

## 🔮 Future Improvements

Potential future improvements include:

* Automated unit and integration tests
* End-to-end testing
* API documentation with Swagger/OpenAPI
* CI/CD pipeline
* Advanced search and filtering
* Pagination improvements
* Resume/document upload
* Recruiter company profiles
* Analytics
* Recommendation systems
* Centralized application logging
* Production monitoring

## 👨‍💻 Author

**Abdulkareem Abdulsalam**

GitHub:

https://github.com/Abdulsalam-k

## 📄 Related Repository

Frontend:

https://github.com/Abdulsalam-k/campusconnect

Live application:

https://campusconnect-red-alpha.vercel.app
