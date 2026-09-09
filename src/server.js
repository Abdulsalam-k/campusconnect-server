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

if (isProduction) {
  app.set("trust proxy", 1);
}


// =====================================================
// SECURITY HEADERS
// =====================================================

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

// Normalize origins so values such as
// https://example.com/
// and
// https://example.com
// are treated as the same origin.

function normalizeOrigin(origin) {
  return origin
    ?.trim()
    .replace(/\/+$/, "");
}

// Read comma-separated frontend origins.
const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

// Helpful server-side logging.
console.log(
  "Allowed CORS origins:",
  allowedOrigins
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header,
      // such as Postman, curl and some server tools.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin =
        normalizeOrigin(origin);

      if (
        allowedOrigins.includes(
          normalizedOrigin
        )
      ) {
        return callback(null, true);
      }

      console.error(
        "Blocked CORS origin:",
        origin
      );

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

    optionsSuccessStatus: 204,
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