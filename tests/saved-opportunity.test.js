require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");
const Opportunity = require("../src/models/Opportunity");

const BASE_URL =
  "http://localhost:5000";

const uniqueId = Date.now();

const studentEmail =
  `campusconnect-saved-student-${uniqueId}@example.com`;

const otherStudentEmail =
  `campusconnect-saved-other-${uniqueId}@example.com`;

const recruiterEmail =
  `campusconnect-saved-recruiter-${uniqueId}@example.com`;

const password =
  "TestPassword123";

let studentToken;
let otherStudentToken;

let studentUserId;
let otherStudentUserId;
let recruiterUserId;
let opportunityId;

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

  const hashedPassword =
    await bcrypt.hash(
      password,
      10
    );

  const recruiter =
    await User.create({
      name:
        "Saved Opportunity Test Recruiter",
      email: recruiterEmail,
      password: hashedPassword,
      role: "recruiter",
      isActive: true,
    });

  recruiterUserId =
    recruiter._id;

  const opportunity =
    await Opportunity.create({
      title:
        "Saved Opportunity Test",
      company:
        "CampusConnect Test Company",
      description:
        "Temporary opportunity for saved opportunity security testing.",
      type: "Internship",
      location: "Lagos",
      mode: "Remote",
      category:
        "Software Development",
      skills: [
        "JavaScript",
        "React",
      ],
      deadline: "2099-12-31",
      createdBy:
        recruiter._id,
    });

  opportunityId =
    opportunity._id.toString();
});

test.after(async () => {
  try {
    if (studentUserId) {
      await User.findByIdAndDelete(
        studentUserId
      );
    }

    if (otherStudentUserId) {
      await User.findByIdAndDelete(
        otherStudentUserId
      );
    }

    if (recruiterUserId) {
      await User.findByIdAndDelete(
        recruiterUserId
      );
    }

    if (opportunityId) {
      await Opportunity.findByIdAndDelete(
        opportunityId
      );
    }
  } catch (error) {
    console.error(
      "Saved opportunity test cleanup failed:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
});

test("Register saved-opportunity test student", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name:
          "Saved Opportunity Test Student",
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

test("Login saved-opportunity test student", async () => {
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

test("Student can save an opportunity", async () => {
  const response = await fetch(
    `${BASE_URL}/api/saved-opportunities/${opportunityId}`,
    {
      method: "POST",
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
    201
  );

  assert.strictEqual(
    data.success,
    true
  );

  assert.strictEqual(
    data.data.opportunityId.toString(),
    opportunityId
  );
});

test("Student can view saved opportunities", async () => {
  const response = await fetch(
    `${BASE_URL}/api/saved-opportunities`,
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
      (opportunity) =>
        opportunity._id.toString() ===
        opportunityId
    )
  );
});

test("Student cannot save the same opportunity twice", async () => {
  const response = await fetch(
    `${BASE_URL}/api/saved-opportunities/${opportunityId}`,
    {
      method: "POST",
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
    409
  );

  assert.strictEqual(
    data.success,
    false
  );
});

test("Register second student", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name:
          "Second Saved Opportunity Student",
        email: otherStudentEmail,
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

  otherStudentUserId =
    data.data.id;
});

test("Login second student", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: otherStudentEmail,
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

  otherStudentToken =
    data.token;
});

test("Second student has a separate saved-opportunity list", async () => {
  const response = await fetch(
    `${BASE_URL}/api/saved-opportunities`,
    {
      headers: {
        Authorization:
          `Bearer ${otherStudentToken}`,
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
    !data.data.some(
      (opportunity) =>
        opportunity._id.toString() ===
        opportunityId
    )
  );
});

test("Student can remove their saved opportunity", async () => {
  const response = await fetch(
    `${BASE_URL}/api/saved-opportunities/${opportunityId}`,
    {
      method: "DELETE",
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
});