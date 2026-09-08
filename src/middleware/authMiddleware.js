const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  try {
    // ==========================================
    // CHECK JWT SECRET CONFIGURATION
    // ==========================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "Authentication error: JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Authentication service is not properly configured.",
      });
    }

    // ==========================================
    // GET AUTHORIZATION HEADER
    // ==========================================

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message:
          "Authorization token is required.",
      });
    }

    // ==========================================
    // VALIDATE BEARER FORMAT
    // ==========================================

    const parts =
      authHeader.trim().split(/\s+/);

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format.",
      });
    }

    const token = parts[1];

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ==========================================
    // VALIDATE REQUIRED JWT PAYLOAD
    // ==========================================

    if (
      !decoded ||
      !decoded.userId ||
      !decoded.role
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    // ==========================================
    // ATTACH VERIFIED USER DATA
    // ==========================================

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // ==========================================
    // CONTINUE
    // ==========================================

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token.",
    });
  }
}

module.exports = protect;