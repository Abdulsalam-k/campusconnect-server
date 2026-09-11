const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["student", "recruiter", "admin"],
      default: "student",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    skills: {
      type: [String],
      default: [],

      validate: {
        validator: function (skills) {
          return (
            Array.isArray(skills) &&
            skills.length <= 20 &&
            skills.every(
              (skill) =>
                typeof skill === "string" &&
                skill.trim().length > 0 &&
                skill.trim().length <= 50
            )
          );
        },

        message:
          "A user can have at most 20 skills, and each skill must be between 1 and 50 characters.",
      },
    },

    education: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    department: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    profileImage: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    savedOpportunities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Opportunity",
      },
    ],

    // Password reset fields
    passwordResetTokenHash: {
      type: String,
      default: "",
      maxlength: 128,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;