const express = require("express");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const multer = require("multer");

const User = require("../models/User");

const protect = require("../middleware/authMiddleware");

const {
  sendPasswordResetEmail,
} = require("../utils/sendEmail");

const cloudinary = require("../utils/cloudinary");

const router = express.Router();

// =====================================================
// MULTER MEMORY STORAGE
// =====================================================

const uploadProfileImage = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, PNG and WebP images are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// =====================================================
// IMAGE SIGNATURE VALIDATION
// =====================================================

function getRealImageType(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  // JPEG
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

// =====================================================
// CLOUDINARY HELPERS
// =====================================================

function uploadImageToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder: "campusconnect/profiles",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    uploadStream.end(fileBuffer);
  });
}

function getCloudinaryPublicId(imageUrl) {
  try {
    const url = new URL(imageUrl);

    const uploadMarker = "/image/upload/";

    const uploadIndex =
      url.pathname.indexOf(uploadMarker);

    if (uploadIndex === -1) {
      return null;
    }

    let publicId =
      url.pathname.substring(
        uploadIndex + uploadMarker.length
      );

    // Remove transformation segments such as:
    // c_fill,w_500,h_500
    const pathParts =
      publicId.split("/");

    const versionIndex =
      pathParts.findIndex((part) =>
        /^v\d+$/.test(part)
      );

    if (versionIndex !== -1) {
      publicId =
        pathParts
          .slice(versionIndex + 1)
          .join("/");
    }

    // Remove file extension.
    publicId =
      publicId.replace(
        /\.(jpg|jpeg|png|webp|gif)$/i,
        ""
      );

    return publicId || null;
  } catch (error) {
    return null;
  }
}

async function deleteCloudinaryImage(imageUrl) {
  if (
    !imageUrl ||
    !imageUrl.includes(
      "res.cloudinary.com"
    )
  ) {
    return;
  }

  const publicId =
    getCloudinaryPublicId(imageUrl);

  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
        invalidate: true,
      }
    );
  } catch (error) {
    console.error(
      "Cloudinary image deletion failed:",
      error.message
    );
  }
}

// =====================================================
// REGISTER
// =====================================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student account
 *     description: Creates a new CampusConnect user account.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Abdulkareem Abdulsalam
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Missing required fields or invalid password
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body || {};

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user =
        await User.create({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
        });

      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        skills: user.skills,
        education: user.education,
        department: user.department,
        location: user.location,
        bio: user.bio,
        profileImage:
          user.profileImage,
        createdAt:
          user.createdAt,
      };

      return res.status(201).json({
        success: true,
        message:
          "Account created successfully.",
        data: userResponse,
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create account.",
      });
    }
  }
);

// =====================================================
// LOGIN
// =====================================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to CampusConnect
 *     description: Authenticates a user and returns a JWT token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account has been deactivated
 *       500:
 *         description: Server error
 */
router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body || {};

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required.",
        });
      }

      const user =
        await User.findOne({
          email:
            email
              .toLowerCase()
              .trim(),
        });

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      if (
        user.isActive === false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been deactivated. Please contact an administrator.",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message:
            "JWT secret is not configured.",
        });
      }

      const token =
        jwt.sign(
          {
            userId: user._id,
            role: user.role,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        skills: user.skills,
        education: user.education,
        department: user.department,
        location: user.location,
        bio: user.bio,
        profileImage:
          user.profileImage,
      };

      return res.status(200).json({
        success: true,
        message:
          "Login successful.",
        token,
        data: userResponse,
      });
    } catch (error) {
      console.error(
        "Login error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to login.",
      });
    }
  }
);

// =====================================================
// FORGOT PASSWORD
// =====================================================

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     description: Sends a password reset link when the account exists.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *     responses:
 *       200:
 *         description: Password reset request processed
 *       400:
 *         description: Email is required
 *       500:
 *         description: Server error or email delivery failure
 */
router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const { email } =
        req.body || {};

      if (
        !email ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required.",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      // Generic response prevents
      // account enumeration.
      if (!user) {
        return res.status(200).json({
          success: true,
          message:
            "If an account exists with that email, a password reset link has been sent.",
        });
      }

      const resetToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      const resetTokenHash =
        crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

      const resetExpires =
        new Date(
          Date.now() +
            15 * 60 * 1000
        );

      user.passwordResetTokenHash =
        resetTokenHash;

      user.passwordResetExpires =
        resetExpires;

      await user.save();

      const frontendUrl =
        process.env.FRONTEND_APP_URL ||
        "http://localhost:5173";

      const resetLink =
        `${frontendUrl.replace(/\/+$/, "")}/reset-password/${resetToken}`;

      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetLink,
        });
      } catch (emailError) {
        console.error(
          "Password reset email failed:",
          emailError.message
        );

        user.passwordResetTokenHash =
          "";

        user.passwordResetExpires =
          null;

        await user.save();

        return res.status(500).json({
          success: false,
          message:
            "We could not send the password reset email. Please try again later.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process password reset request.",
      });
    }
  }
);

// =====================================================
// RESET PASSWORD
// =====================================================

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset account password
 *     description: Sets a new password using a valid password reset token.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token received by email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token, missing fields, or password mismatch
 *       500:
 *         description: Server error
 */
router.post(
  "/reset-password/:token",
  async (req, res) => {
    try {
      const { token } =
        req.params;

      const {
        password,
        confirmPassword,
      } = req.body || {};

      if (!token) {
        return res.status(400).json({
          success: false,
          message:
            "Reset token is required.",
        });
      }

      if (
        !password ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password and confirmation are required.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      if (
        password !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Passwords do not match.",
        });
      }

      const tokenHash =
        crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

      const user =
        await User.findOne({
          passwordResetTokenHash:
            tokenHash,
          passwordResetExpires: {
            $gt: new Date(),
          },
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "This reset link is invalid or has expired.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      user.password =
        hashedPassword;

      user.passwordResetTokenHash =
        "";

      user.passwordResetExpires =
        null;

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "Password reset successful. You can now log in with your new password.",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to reset password.",
      });
    }
  }
);

// =====================================================
// GET CURRENT USER
// =====================================================

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     description: Returns the profile of the currently authenticated user.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user returned successfully
 *       401:
 *         description: Missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  "/me",
  protect,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error(
        "Fetching current user error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch user.",
      });
    }
  }
);

// =====================================================
// UPDATE PROFILE + PROFILE IMAGE
// =====================================================

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 *     description: Updates profile information and optionally uploads a profile image.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Abdulkareem Abdulsalam
 *               education:
 *                 type: string
 *                 example: Federal University of Technology Akure
 *               department:
 *                 type: string
 *                 example: Software Engineering
 *               location:
 *                 type: string
 *                 example: Lagos
 *               bio:
 *                 type: string
 *                 example: Frontend developer interested in building useful products.
 *               skills:
 *                 type: string
 *                 example: JavaScript
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid profile data or image
 *       401:
 *         description: Missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  "/profile",
  protect,
  uploadProfileImage.single(
    "profileImage"
  ),
  async (req, res) => {
    let newCloudinaryImage = null;

    try {
      const {
        name,
        education,
        department,
        location,
        bio,
        skills,
      } = req.body || {};

      // ==========================================
      // VALIDATE NAME
      // ==========================================

      if (
        !name ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name is required.",
        });
      }

      // ==========================================
      // FIND USER
      // ==========================================

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==========================================
      // SAVE OLD IMAGE URL
      // ==========================================

      const oldProfileImage =
        user.profileImage || "";

      // ==========================================
      // UPDATE TEXT DATA
      // ==========================================

      user.name =
        name.trim();

      user.education =
        education?.trim() || "";

      user.department =
        department?.trim() || "";

      user.location =
        location?.trim() || "";

      user.bio =
        bio?.trim() || "";

      // ==========================================
      // UPDATE SKILLS
      // ==========================================

      if (skills !== undefined) {
        const skillsArray =
          Array.isArray(skills)
            ? skills
            : [skills];

        user.skills =
          skillsArray
            .map((skill) =>
              String(skill).trim()
            )
            .filter(Boolean);
      }

      // ==========================================
      // VALIDATE ACTUAL IMAGE FILE
      // ==========================================

      if (req.file) {
        const realImageType =
          getRealImageType(
            req.file.buffer
          );

        if (
          !realImageType ||
          realImageType !==
            req.file.mimetype
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid image file. Please upload a valid JPG, PNG or WebP image.",
          });
        }

        // ==========================================
        // UPLOAD NEW PROFILE IMAGE
        // ==========================================

        const uploadResult =
          await uploadImageToCloudinary(
            req.file.buffer
          );

        if (
          !uploadResult ||
          !uploadResult.secure_url
        ) {
          throw new Error(
            "Cloudinary image upload failed."
          );
        }

        newCloudinaryImage =
          uploadResult;

        user.profileImage =
          uploadResult.secure_url;
      }

      // ==========================================
      // SAVE USER TO MONGODB
      // ==========================================

      await user.save();

      // ==========================================
      // DELETE OLD CLOUDINARY IMAGE
      // AFTER SUCCESSFUL SAVE
      // ==========================================

      if (
        req.file &&
        oldProfileImage &&
        oldProfileImage.includes(
          "res.cloudinary.com"
        )
      ) {
        await deleteCloudinaryImage(
          oldProfileImage
        );
      }

      // ==========================================
      // RESPONSE
      // ==========================================

      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        skills: user.skills,
        education: user.education,
        department: user.department,
        location: user.location,
        bio: user.bio,
        profileImage:
          user.profileImage,
        createdAt:
          user.createdAt,
      };

      return res.json({
        success: true,
        message:
          req.file
            ? "Profile and profile image updated successfully."
            : "Profile updated successfully.",
        data: userResponse,
      });
    } catch (error) {
      console.error(
        "Profile update error:",
        error.message
      );

      // ==========================================
      // CLEAN UP NEW CLOUDINARY IMAGE
      // IF DATABASE SAVE FAILED
      // ==========================================

      if (
        newCloudinaryImage &&
        newCloudinaryImage.public_id
      ) {
        try {
          await cloudinary.uploader.destroy(
            newCloudinaryImage.public_id,
            {
              resource_type: "image",
              invalidate: true,
            }
          );
        } catch (cleanupError) {
          console.error(
            "Failed to remove new Cloudinary image:",
            cleanupError.message
          );
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to update profile.",
      });
    }
  }
);

// =====================================================
// REMOVE PROFILE IMAGE
// =====================================================

/**
 * @swagger
 * /api/auth/profile-image:
 *   delete:
 *     summary: Remove the authenticated user's profile image
 *     description: Removes the current profile image from the user's account and Cloudinary.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile image removed successfully
 *       400:
 *         description: User does not have a profile photo
 *       401:
 *         description: Missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/profile-image",
  protect,
  async (req, res) => {
    try {
      // ==========================================
      // FIND USER
      // ==========================================

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==========================================
      // CHECK CURRENT IMAGE
      // ==========================================

      const currentProfileImage =
        user.profileImage || "";

      if (!currentProfileImage) {
        return res.status(400).json({
          success: false,
          message:
            "You do not have a profile photo.",
        });
      }

      // ==========================================
      // DELETE CLOUDINARY IMAGE
      // ==========================================

      if (
        currentProfileImage.includes(
          "res.cloudinary.com"
        )
      ) {
        await deleteCloudinaryImage(
          currentProfileImage
        );
      }

      // ==========================================
      // REMOVE IMAGE FROM DATABASE
      // ==========================================

      user.profileImage = "";

      await user.save();

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.json({
        success: true,
        message:
          "Profile photo removed successfully.",
        data: {
          profileImage: "",
        },
      });
    } catch (error) {
      console.error(
        "Remove profile image error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to remove profile photo.",
      });
    }
  }
);

// =====================================================
// MULTER / UPLOAD ERROR HANDLER
// =====================================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Profile image must not exceed 2MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "Profile image upload failed.",
      });
    }

    if (
      error &&
      error.message ===
        "Only JPG, PNG and WebP images are allowed."
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    console.error(
      "Auth route error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected server error occurred.",
    });
  }
);

module.exports = router;