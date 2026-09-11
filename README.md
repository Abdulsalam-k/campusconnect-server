# CampusConnect Backend 🚀

The CampusConnect backend is a secure RESTful API built with **Node.js and Express.js** that powers the CampusConnect student opportunity platform.

It provides authentication, student profiles, opportunities, applications, notifications, saved opportunities, recruiter functionality, administration, role-based access control, password reset, cloud image storage, transactional email, API documentation, and security controls.

The backend is deployed on **Render**, uses **MongoDB Atlas** for persistent data storage, **Cloudinary** for profile image storage, and **Brevo** for transactional email delivery.

## 🌐 Production

**Backend API**

https://campusconnect-server-lcj4.onrender.com

**Frontend**

https://campusconnect-red-alpha.vercel.app

**API Documentation**

https://campusconnect-server-lcj4.onrender.com/api-docs

**Health Check**

https://campusconnect-server-lcj4.onrender.com/api/health

## ✨ Core Features

### 🔐 Authentication

* User registration
* Secure login
* JWT authentication
* Protected routes
* Role-based authorization
* Account activation/deactivation
* Password reset
* Cryptographically secure reset tokens
* Hashed password reset tokens
* 15-minute password reset expiry
* One-time password reset tokens
* Protected authenticated user information
* Generic forgot-password responses to reduce account enumeration

### 👨‍🎓 Student Management

* Student profiles
* Education information
* Department
* Location
* Skills
* Biography
* Profile images
* Cloudinary image storage
* Student directory
* Student profile access
* Profile ownership protection

### 💼 Opportunities

* Create opportunities
* View opportunities
* View opportunity details
* Edit opportunities
* Delete opportunities
* Recruiter ownership protection
* Opportunity categories
* Opportunity types
* Remote, on-site, and hybrid modes
* Skills associated with opportunities
* Opportunity validation

### 📝 Applications

* Submit applications
* Prevent duplicate applications
* View personal applications
* Recruiter application management
* Application ownership protection
* Accept applications
* Reject applications
* Application status management
* Application status notifications
* Recruiter email notifications
* Student status email notifications
* Protection against invalid status transitions

### 🔔 Notifications

* Create system notifications internally
* View personal notifications
* Unread notification counts
* Mark individual notifications as read
* Mark all notifications as read
* Delete personal notifications
* Notification ownership protection

### 💾 Saved Opportunities

* Save opportunities
* Unsave opportunities
* View saved opportunities
* Prevent invalid saved-opportunity operations
* User ownership protection

### 💼 Recruiter Management

* Recruiter dashboard
* View recruiter-owned opportunities
* View applications for owned opportunities
* Applicant information access
* Application status management
* Recruiter authorization

### 🛡️ Administration

* Admin dashboard
* Platform statistics
* User management
* Individual user details
* Role management
* Account activation/deactivation
* Application management
* Protected administrator endpoints

## 🛡️ Security

Security is a major part of the CampusConnect backend architecture.

The backend includes multiple layers of protection:

* JWT authentication
* Role-based authorization
* Recruiter ownership verification
* Application ownership verification
* Notification ownership verification
* Saved-opportunity ownership protection
* Secure password hashing with bcrypt
* Cryptographically secure password reset tokens
* SHA-256 password reset token hashing
* Password reset expiration
* One-time password reset tokens
* Generic forgot-password responses
* Helmet security headers
* Restricted CORS
* General API rate limiting
* Authentication-specific rate limiting
* Registration rate limiting
* JSON request-size limits
* Request input validation
* Mongoose schema validation
* ObjectId validation
* Duplicate application protection
* Profile image size validation
* Profile image MIME validation
* Profile image file-signature validation
* Environment-based secrets
* Cloudinary secure image storage
* Production security headers

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
* Swagger/OpenAPI
* Node.js built-in test runner
* c8 coverage

### Infrastructure

* Render — API hosting
* MongoDB Atlas — Database
* Cloudinary — Image storage
* Brevo — Transactional email

## 🏗️ Architecture

```text
                         CampusConnect Frontend
                              Vercel
                                │
                                │ HTTPS / REST API
                                ▼
                     ┌─────────────────────┐
                     │   Express Backend   │
                     │       Render        │
                     └──────────┬──────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
      │ MongoDB Atlas │ │   Cloudinary  │ │     Brevo     │
      │   Database    │ │ Profile Images│ │ Transactional  │
      │               │ │               │ │     Email     │
      └───────────────┘ └───────────────┘ └───────────────┘
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

CampusConnect uses JWT-based authentication.

```text
Client
  ↓
POST /api/auth/login
  ↓
Validate email + password
  ↓
Compare password with bcrypt
  ↓
Generate JWT
  ↓
Return token
  ↓
Client sends:
Authorization: Bearer <token>
  ↓
Authentication middleware
  ↓
Verify JWT
  ↓
Attach user ID + role
  ↓
Access protected resource
```

The JWT contains the authenticated user's identity and role information used by protected routes.

## 👥 Role-Based Authorization

CampusConnect supports three primary roles:

```text
student
recruiter
admin
```

Authorization follows this structure:

```text
JWT
 ↓
Authentication middleware
 ↓
Identify authenticated user
 ↓
Role authorization middleware
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
* Manage recruiter-specific resources

### Admin

Administrators can:

* Manage users
* Change user roles
* Activate/deactivate accounts
* View platform statistics
* View applications
* Manage platform-level resources

## 🔑 Password Reset

The password reset system uses a secure token workflow.

```text
Forgot Password Request
        ↓
Find User
        ↓
Generate Cryptographically Secure Token
        ↓
Hash Token With SHA-256
        ↓
Store Token Hash + Expiry
        ↓
Send Reset Link Through Brevo
        ↓
User Opens Reset Link
        ↓
Backend Hashes Submitted Token
        ↓
Compare Token Hashes
        ↓
Check Expiration
        ↓
Hash New Password With bcrypt
        ↓
Clear Reset Token
        ↓
Password Successfully Changed
```

Reset tokens:

* Expire after 15 minutes
* Are stored as hashes rather than plaintext
* Are invalidated after successful use
* Are generated using cryptographically secure random bytes

## 📧 Transactional Email

CampusConnect uses the **Brevo transactional email API** instead of SMTP.

Emails include:

* Password reset messages
* New application notifications
* Application acceptance notifications
* Application rejection notifications

Using the Brevo API avoids relying on outbound SMTP connectivity from the production hosting environment.

## 🖼️ Image Upload Security

Profile images are processed using **Multer** and **Cloudinary**.

The backend:

1. Limits uploads to 2 MB
2. Accepts JPG, PNG, and WebP
3. Validates the client-provided MIME type
4. Checks the actual file signature
5. Uploads validated images to Cloudinary
6. Stores the secure Cloudinary URL
7. Removes the previous Cloudinary image after successful replacement

This prevents relying solely on the MIME type supplied by the client.

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

## 📚 Swagger / OpenAPI Documentation

CampusConnect provides interactive API documentation using **Swagger/OpenAPI**.

Production documentation:

https://campusconnect-server-lcj4.onrender.com/api-docs

The documentation includes the major API resources and protected endpoints.

JWT-protected endpoints use Bearer authentication.

The API documentation makes it easier to understand, test, and integrate with the CampusConnect backend.

## 🧪 Automated Testing

The backend has a dedicated automated test suite using the Node.js test runner and c8 for coverage reporting.

### Current Results

**61 automated tests passing**

**100% statement coverage**

**100% branch coverage**

**100% function coverage**

**100% line coverage**

Testing covers major backend functionality including:

* Authentication
* Registration
* Login
* Password reset
* Profile management
* Profile image handling
* Opportunity creation
* Opportunity editing
* Opportunity deletion
* Application submission
* Duplicate application protection
* Application status updates
* Notifications
* Saved opportunities
* Recruiter authorization
* Admin authorization
* Ownership protection
* Security behavior
* Production configuration

Run the backend tests with:

```bash
npm test
```

Generate the coverage report with:

```bash
npm run test:coverage
```

## 🔒 Environment Variables

Never commit real environment variables, credentials, API keys, or secrets to GitHub.

Example configuration:

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

Production secrets are configured through Render environment variables.

## 🚀 Local Development

Clone the repository:

```bash
git clone https://github.com/Abdulsalam-k/campusconnect-server.git
```

Enter the project directory:

```bash
cd campusconnect-server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example` as a guide.

Start the development server:

```bash
npm run dev
```

The API runs locally at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

Swagger documentation:

```text
http://localhost:5000/api-docs
```

## 🌍 Production Deployment

The backend is deployed on **Render**.

Production architecture:

```text
Vercel
React Frontend
      │
      │ HTTPS
      ▼
Render
Express REST API
      │
      ├──────────────► MongoDB Atlas
      │
      ├──────────────► Cloudinary
      │
      └──────────────► Brevo
```

### Production Services

| Service       | Purpose               |
| ------------- | --------------------- |
| Render        | Express API hosting   |
| MongoDB Atlas | Database              |
| Cloudinary    | Profile image storage |
| Brevo         | Transactional email   |
| Vercel        | React frontend        |

The production backend communicates with the deployed React frontend over HTTPS.

## 🛡️ Production Hardening

The production backend includes additional hardening measures such as:

* Restricted production CORS
* Helmet security headers
* HSTS in production
* API rate limiting
* Authentication rate limiting
* Registration rate limiting
* Request body size limits
* Environment-based secrets
* API 404 handling
* Global error handling
* Production frontend origin validation
* Protected role-based routes

## 🎯 Purpose

CampusConnect was built as a realistic full-stack platform to demonstrate practical backend and software engineering skills.

The backend demonstrates:

* REST API development
* Express.js architecture
* Database modeling
* Authentication
* Authorization
* Role-based access control
* Secure password management
* Password reset security
* File upload security
* Cloud image storage
* Transactional email
* API documentation
* Automated testing
* Security hardening
* Production deployment

## 🔮 Future Improvements

Potential future improvements include:

* Centralized production logging
* Advanced application analytics
* Advanced recommendation systems
* Recruiter company profiles
* Resume and document management
* More advanced search capabilities
* Production monitoring
* CI/CD automation
* End-to-end testing
* Performance monitoring

## 👨‍💻 Author

**Abdulkareem Abdulsalam**

GitHub:

https://github.com/Abdulsalam-k

## 🔗 Related Repositories

### Frontend

https://github.com/Abdulsalam-k/campusconnect

### Backend

https://github.com/Abdulsalam-k/campusconnect-server

### Live Application

https://campusconnect-red-alpha.vercel.app

### API Documentation

https://campusconnect-server-lcj4.onrender.com/api-docs

---

CampusConnect was developed as a full-stack portfolio project focused on building a realistic student opportunity platform from backend architecture and database design through authentication, security, cloud services, automated testing, API documentation, and production deployment.
