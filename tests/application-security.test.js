require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../src/models/User");
const Opportunity = require("../src/models/Opportunity");
const Application = require("../src/models/Application");
const Notification = require("../src/models/Notification");

const BASE_URL =
  "http://localhost:5000";

const uniqueId = Date.now();

const studentEmail =
  `campusconnect-application-student-${uniqueId}@example.com`;

const recruiterEmail =
  `campusconnect-application-recruiter-${uniqueId}@example.com`;

const password =
  "TestPassword123";

let studentToken;
let studentUserId;
let recruiterUserId;
let opportunityId;
let applicationId;

async function connectTestDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(
    process.env.MONGODB_URI ||
      process.env.MONGO_URI
  );
}

test.before(async () => {
  await connectTestDatabase();

  // Create temporary recruiter directly
  // because the public registration route
  // creates students by default.
  const hashedPassword =
    await bcrypt.hash(
      password,
      10
    );

  const recruiter =
    await User.create({
      name: "Application Test Recruiter",
      email: recruiterEmail,
      password: hashedPassword,
      role: "recruiter",
      isActive: true,
    });

  recruiterUserId =
    recruiter._id;

  // Create temporary opportunity
  const opportunity =
    await Opportunity.create({
      title: "Application Test Opportunity",
      company: "CampusConnect Test Company",
      description:
        "Temporary opportunity used for automated application security testing.",
      type: "Internship",
      location: "Lagos",
      mode: "Remote",
      category: "Software Development",
      skills: [
        "JavaScript",
        "React",
      ],
      deadline: "2099-12-31",
      createdBy: recruiter._id,
    });

  opportunityId =
    opportunity._id.toString();
});

test.after(async () => {
  try {
    if (applicationId) {
      await Application.findByIdAndDelete(
        applicationId
      );
    }

    if (studentUserId) {
      await Notification.deleteMany({
        userId: studentUserId,
      });

      await User.findByIdAndDelete(
        studentUserId
      );
    }

    if (recruiterUserId) {
      await Notification.deleteMany({
        userId: recruiterUserId,
      });

      await Application.deleteMany({
        opportunityId:
          opportunityId,
      });

      await Opportunity.findByIdAndDelete(
        opportunityId
      );

      await User.findByIdAndDelete(
        recruiterUserId
      );
    }
  } catch (error) {
    console.error(
      "Application test cleanup failed:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
});

test("Register application test student", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Application Test Student",
        email: studentEmail,
        password,
      }),
    }
  );

  const data =
    await response.json();

  assert.strictEqual(
    response.status,
    201
  );

  assert.strictEqual(
    data.success,
    true
  );

  studentUserId =
    data.data.id;
});

test("Login application test student", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: studentEmail,
        password,
      }),
    }
  );

  const data =
    await response.json();

  assert.strictEqual(
    response.status,
    200
  );

  assert.strictEqual(
    data.success,
    true
  );

  assert.strictEqual(
    data.data.role,
    "student"
  );

  assert.ok(data.token);

  studentToken =
    data.token;
});

test("Student can submit an application", async () => {
  const response = await fetch(
    `${BASE_URL}/api/applications`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        opportunityId,
        fullName:
          "Application Test Student",
        email: studentEmail,
        phone:
          "+2348012345678",
        coverLetter:
          "I am interested in this opportunity and have relevant frontend development experience.",
      }),
    }
  );

  const data =
    await response.json();

  assert.strictEqual(
    response.status,
    201
  );

  assert.strictEqual(
    data.success,
    true
  );

  assert.strictEqual(
    data.message,
    "Application submitted successfully."
  );

  assert.ok(data.data._id);

  applicationId =
    data.data._id;
});

test("Student can view their own applications", async () => {
  const response = await fetch(
    `${BASE_URL}/api/applications/my`,
    {
      headers: {
        Authorization:
          `Bearer ${studentToken}`,
      },
    }
  );

  const data =
    await response.json();

  assert.strictEqual(
    response.status,
    200
  );

  assert.strictEqual(
    data.success,
    true
  );

  assert.ok(
    Array.isArray(data.data)
  );

  assert.ok(
    data.data.some(
      (application) =>
        application._id.toString() ===
        applicationId.toString()
    )
  );
});

test("Student cannot access all applications", async () => {
  const response = await fetch(
    `${BASE_URL}/api/applications`,
    {
      headers: {
        Authorization:
          `Bearer ${studentToken}`,
      },
    }
  );

  const data =
    await response.json();

  assert.strictEqual(
    response.status,
    403
  );

  assert.strictEqual(
    data.success,
    false
  );
});

test("Student cannot update application status", async () => {
  const response = await fetch(
    `${BASE_URL}/api/applications/${applicationId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        status: "Accepted",
      }),
    }
  );

  const data =
    await response.json();

  assert.strictEqual(
    response.status,
    403
  );

  assert.strictEqual(
    data.success,
    false
  );
});