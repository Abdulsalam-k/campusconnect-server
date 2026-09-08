const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

require("dotenv").config();

const opportunityRoutes = require("./routes/opportunityRoutes");
const studentRoutes = require("./routes/studentRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const authRoutes = require("./routes/authRoutes");
const savedOpportunityRoutes = require("./routes/savedOpportunityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const adminRoutes = require("./routes/adminRoutes");

const connectDB = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;


// =====================================================
// ENVIRONMENT
// =====================================================

const isProduction =
  process.env.NODE_ENV === "production";


// =====================================================
// TRUST PROXY
// =====================================================

// Useful when deployed behind a reverse proxy such as
// Render, Railway, Nginx, etc.
if (isProduction) {
  app.set("trust proxy", 1);
}


// =====================================================
// SECURITY HEADERS
// =====================================================

// Helmet adds a collection of security-related
// HTTP response headers.
//
// HSTS is disabled during local development because
// forcing HTTPS on localhost is undesirable.
app.use(
  helmet({
    strictTransportSecurity: isProduction,

    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);


// =====================================================
// CORS
// =====================================================

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests such as Postman/curl that may
      // not include an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          "Origin is not allowed by CORS."
        )
      );
    },
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);


// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: "100kb",
  })
);


// =====================================================
// GENERAL API RATE LIMIT
// =====================================================

// Protect the API against excessive repeated
// requests while keeping normal application use
// comfortable.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);


// =====================================================
// AUTHENTICATION RATE LIMIT
// =====================================================

// Stricter limit for authentication-related
// endpoints to reduce brute-force and abuse attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

app.use(
  "/api/auth/login",
  authLimiter
);

app.use(
  "/api/auth/forgot-password",
  authLimiter
);

app.use(
  "/api/auth/reset-password",
  authLimiter
);


// =====================================================
// STATIC FILES
// PROFILE IMAGES
// =====================================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    message:
      "CampusConnect API is running 🚀",
  });
});


// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api/opportunities",
  opportunityRoutes
);

app.use(
  "/api/students",
  studentRoutes
);

app.use(
  "/api/applications",
  applicationRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/saved-opportunities",
  savedOpportunityRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/recruiter",
  recruiterRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);


// =====================================================
// 404 API HANDLER
// =====================================================

app.use(
  "/api",
  (req, res) => {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found.",
    });
  }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error.message
    );

    // CORS errors
    if (
      error.message ===
      "Origin is not allowed by CORS."
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Request origin is not allowed.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "An unexpected server error occurred.",
    });
  }
);


// =====================================================
// CONNECT DATABASE
// =====================================================

connectDB();


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(
    `CampusConnect API running on http://localhost:${PORT}`
  );
});