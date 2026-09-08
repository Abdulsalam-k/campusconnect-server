require("dotenv").config();

const mongoose = require("mongoose");

const Opportunity = require("../models/Opportunity");

const opportunities = [
  {
    title: "Frontend Developer Intern",
    company: "TechNova Africa",
    description:
      "Join TechNova Africa as a frontend developer intern and work on modern web applications while gaining practical industry experience.",
    type: "Internship",
    location: "Lagos",
    mode: "Hybrid",
    category: "Technology",
    skills: [
      "React",
      "JavaScript",
      "CSS",
    ],
    deadline: "September 30, 2026",
  },

  {
    title: "UI/UX Design Intern",
    company: "Creative Labs",
    description:
      "Work with the design team to create user-friendly digital experiences and contribute to real-world product designs.",
    type: "Internship",
    location: "Remote",
    mode: "Remote",
    category: "Design",
    skills: [
      "Figma",
      "UI/UX",
      "Prototyping",
    ],
    deadline: "October 5, 2026",
  },

  {
    title: "Backend Developer",
    company: "FinTech Solutions",
    description:
      "Help build and maintain backend services for financial technology products using modern server-side technologies.",
    type: "Part-time",
    location: "Abuja",
    mode: "Hybrid",
    category: "Technology",
    skills: [
      "Node.js",
      "Express",
      "MongoDB",
    ],
    deadline: "October 12, 2026",
  },

  {
    title: "Data Analyst Intern",
    company: "Insight Analytics",
    description:
      "Analyze datasets, create meaningful reports, and support data-driven decision making across the organization.",
    type: "Internship",
    location: "Ibadan",
    mode: "On-site",
    category: "Data",
    skills: [
      "Python",
      "SQL",
      "Power BI",
    ],
    deadline: "September 25, 2026",
  },

  {
    title: "Mobile App Developer",
    company: "AppWorks",
    description:
      "Develop and improve cross-platform mobile applications while working with an experienced engineering team.",
    type: "Contract",
    location: "Remote",
    mode: "Remote",
    category: "Technology",
    skills: [
      "Flutter",
      "Dart",
      "Firebase",
    ],
    deadline: "October 20, 2026",
  },

  {
    title: "Social Media Manager",
    company: "GrowthHub",
    description:
      "Create engaging social media content and help develop strategies that increase online engagement and brand awareness.",
    type: "Part-time",
    location: "Lagos",
    mode: "Remote",
    category: "Marketing",
    skills: [
      "Content Creation",
      "Marketing",
      "Social Media",
    ],
    deadline: "October 8, 2026",
  },
];

async function seedOpportunities() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    await Opportunity.deleteMany({});

    await Opportunity.insertMany(opportunities);

    console.log(
      `${opportunities.length} opportunities inserted successfully 🚀`
    );

    await mongoose.connection.close();

    console.log("Database connection closed.");
  } catch (error) {
    console.error(
      "Seeding failed:",
      error.message
    );

    process.exit(1);
  }
}

seedOpportunities();

