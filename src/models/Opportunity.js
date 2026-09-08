const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
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
    },

    skills: {
      type: [String],
      default: [],
    },

    deadline: {
      type: String,
      required: true,
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

