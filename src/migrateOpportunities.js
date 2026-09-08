require("dotenv").config();

const mongoose = require("mongoose");

const Opportunity = require("./models/Opportunity");

const RECRUITER_ID = "6a9bb90388d39308699f9c24";

async function migrateOpportunities() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully 🚀");

    const result = await Opportunity.updateMany(
      {},
      {
        $set: {
          createdBy: RECRUITER_ID,
        },
      }
    );

    console.log(
      `${result.modifiedCount} opportunity(s) updated successfully.`
    );

    await mongoose.disconnect();

    console.log("Migration complete.");
  } catch (error) {
    console.error(
      "Migration error:",
      error.message
    );

    await mongoose.disconnect();
  }
}

migrateOpportunities();