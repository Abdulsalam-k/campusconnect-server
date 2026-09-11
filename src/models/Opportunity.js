const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    company: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 5000,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "Internship",
        "Part-time",
        "Full-time",
        "Contract",
      ],
    },

    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    mode: {
      type: String,
      required: true,
      enum: [
        "Remote",
        "On-site",
        "Hybrid",
      ],
    },

    category: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
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
          "An opportunity can have at most 20 skills, and each skill must be between 1 and 50 characters.",
      },
    },

    deadline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Opportunity = mongoose.model(
  "Opportunity",
  opportunitySchema
);

module.exports = Opportunity;