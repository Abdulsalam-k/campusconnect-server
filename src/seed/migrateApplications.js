const mongoose = require("mongoose");
require("dotenv").config();

const Application = require("../models/Application");
const Opportunity = require("../models/Opportunity");

async function migrateApplications() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    const opportunities = await Opportunity.find().sort({
      createdAt: 1,
    });

    if (opportunities.length < 6) {
      throw new Error(
        "Expected at least 6 opportunities in the database."
      );
    }

    const opportunityMap = {
      1: opportunities[0]._id,
      2: opportunities[1]._id,
      3: opportunities[2]._id,
      4: opportunities[3]._id,
      5: opportunities[4]._id,
      6: opportunities[5]._id,
    };

    const applications =
      await Application.collection.find({}).toArray();

    let migratedCount = 0;

    for (const application of applications) {
      const oldOpportunityId =
        application.opportunityId;

      if (
        typeof oldOpportunityId !== "number"
      ) {
        continue;
      }

      const newOpportunityId =
        opportunityMap[oldOpportunityId];

      if (!newOpportunityId) {
        console.log(
          `No opportunity found for old ID ${oldOpportunityId}`
        );

        continue;
      }

      await Application.collection.updateOne(
        {
          _id: application._id,
        },
        {
          $set: {
            opportunityId: newOpportunityId,
          },
        }
      );

      migratedCount++;

      console.log(
        `Migrated application ${application._id} from opportunity ${oldOpportunityId}`
      );
    }

    console.log(
      `Migration complete. ${migratedCount} application(s) migrated.`
    );
  } catch (error) {
    console.error(
      "Migration failed:",
      error.message
    );
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB connection closed.");
  }
}

migrateApplications();