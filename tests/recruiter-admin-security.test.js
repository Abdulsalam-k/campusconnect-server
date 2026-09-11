require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../src/models/User");
const Opportunity = require("../src/models/Opportunity");
const Application = require("../src/models/Application");
const Notification = require("../src/models/Notification");

const BASE_URL =
  "http://localhost:5000";

const uniqueId = Date.now();

const recruiterOneEmail =
  `campusconnect-recruiter-one-${uniqueId}@example.com`;

const recruiterTwoEmail =
  `campusconnect-recruiter-two-${uniqueId}@example.com`;

const studentEmail =
  `campusconnect-recruiter-student-${uniqueId}@example.com`;

const adminEmail =
  `campusconnect-admin-${uniqueId}@example.com`;

const password =
  "TestPassword123";

let recruiterOneId;
let recruiterTwoId;
let studentId;
let adminId;

let recruiterOneToken;
let recruiterTwoToken;
let adminToken;

let opportunityOneId;
let opportunityTwoId;
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

function createToken(userId, role) {
  return jwt.sign(
    {
      userId,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
}

test.before(async () => {
  await connectTestDatabase();

  const hashedPassword =
    await bcrypt.hash(
      password,
      10
    );

  const recruiterOne =
    await User.create({
      name:
        "Recruiter Security Test One",
      email:
        recruiterOneEmail,
      password: hashedPassword,
      role: "recruiter",
      isActive: true,
    });

  recruiterOneId =
    recruiterOne._id;

  recruiterOneToken =
    createToken(
      recruiterOne._id,
      "recruiter"
    );

  const recruiterTwo =
    await User.create({
      name:
        "Recruiter Security Test Two",
      email:
        recruiterTwoEmail,
      password: hashedPassword,
      role: "recruiter",
      isActive: true,
    });

  recruiterTwoId =
    recruiterTwo._id;

  recruiterTwoToken =
    createToken(
      recruiterTwo._id,
      "recruiter"
    );

  const student =
    await User.create({
      name:
        "Recruiter Security Test Student",
      email:
        studentEmail,
      password: hashedPassword,
      role: "student",
      isActive: true,
    });

  studentId =
    student._id;

  const admin =
    await User.create({
      name:
        "Admin Security Test User",
      email:
        adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

  adminId =
    admin._id;

  adminToken =
    createToken(
      admin._id,
      "admin"
    );

  const opportunityOne =
    await Opportunity.create({
      title:
        "Recruiter One Test Opportunity",
      company:
        "Recruiter One Test Company",
      description:
        "Temporary opportunity for recruiter ownership security testing.",
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
        recruiterOne._id,
    });

  opportunityOneId =
    opportunityOne._id;

  const opportunityTwo =
    await Opportunity.create({
      title:
        "Recruiter Two Test Opportunity",
      company:
        "Recruiter Two Test Company",
      description:
        "Second temporary opportunity for recruiter ownership security testing.",
      type: "Internship",
      location: "Lagos",
      mode: "Hybrid",
      category:
        "Software Development",
      skills: [
        "Node.js",
      ],
      deadline: "2099-12-31",
      createdBy:
        recruiterTwo._id,
    });

  opportunityTwoId =
    opportunityTwo._id;

  const application =
    await Application.create({
      userId:
        student._id,
      opportunityId:
        opportunityOne._id,
      fullName:
        "Recruiter Security Test Student",
      email:
        studentEmail,
      phone:
        "+2348012345678",
      coverLetter:
        "This temporary application is used to test recruiter ownership and access control.",
      status: "Pending",
    });

  applicationId =
    application._id;
});

test.after(async () => {
  try {
    if (applicationId) {
      await Application.findByIdAndDelete(
        applicationId
      );
    }

    if (opportunityOneId) {
      await Opportunity.findByIdAndDelete(
        opportunityOneId
      );
    }

    if (opportunityTwoId) {
      await Opportunity.findByIdAndDelete(
        opportunityTwoId
      );
    }

    if (recruiterOneId) {
      await Notification.deleteMany({
        userId: recruiterOneId,
      });

      await User.findByIdAndDelete(
        recruiterOneId
      );
    }

    if (recruiterTwoId) {
      await Notification.deleteMany({
        userId: recruiterTwoId,
      });

      await User.findByIdAndDelete(
        recruiterTwoId
      );
    }

    if (studentId) {
      await Notification.deleteMany({
        userId: studentId,
      });

      await User.findByIdAndDelete(
        studentId
      );
    }

    if (adminId) {
      await Notification.deleteMany({
        userId: adminId,
      });

      await User.findByIdAndDelete(
        adminId
      );
    }
  } catch (error) {
    console.error(
      "Recruiter/admin test cleanup failed:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
});

// =====================================================
// RECRUITER TESTS
// =====================================================

test("Recruiter can access their dashboard", async () => {
  const response = await fetch(
    `${BASE_URL}/api/recruiter/dashboard`,
    {
      headers: {
        Authorization:
          `Bearer ${recruiterOneToken}`,
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
    Array.isArray(
      data.data.opportunities
    )
  );

  assert.ok(
    data.data.opportunities.some(
      (opportunity) =>
        opportunity._id.toString() ===
        opportunityOneId.toString()
    )
  );
});

test("Recruiter can view an application for their own opportunity", async () => {
  const response = await fetch(
    `${BASE_URL}/api/recruiter/applications/${applicationId}`,
    {
      headers: {
        Authorization:
          `Bearer ${recruiterOneToken}`,
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

  assert.strictEqual(
    data.data._id.toString(),
    applicationId.toString()
  );
});

test("Recruiter cannot view another recruiter's application", async () => {
  const response = await fetch(
    `${BASE_URL}/api/recruiter/applications/${applicationId}`,
    {
      headers: {
        Authorization:
          `Bearer ${recruiterTwoToken}`,
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

test("Recruiter cannot access another recruiter's dashboard data", async () => {
  const response = await fetch(
    `${BASE_URL}/api/recruiter/dashboard`,
    {
      headers: {
        Authorization:
          `Bearer ${recruiterTwoToken}`,
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
    !data.data.opportunities.some(
      (opportunity) =>
        opportunity._id.toString() ===
        opportunityOneId.toString()
    )
  );
});

test("Student cannot access recruiter dashboard", async () => {
  const studentToken =
    createToken(
      studentId,
      "student"
    );

  const response = await fetch(
    `${BASE_URL}/api/recruiter/dashboard`,
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

// =====================================================
// ADMIN TESTS
// =====================================================

test("Admin can access the admin dashboard", async () => {
  const response = await fetch(
    `${BASE_URL}/api/admin/dashboard`,
    {
      headers: {
        Authorization:
          `Bearer ${adminToken}`,
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
    data.data.stats
  );

  assert.ok(
    typeof data.data.stats.totalUsers ===
      "number"
  );

  assert.ok(
    Array.isArray(
      data.data.recentUsers
    )
  );
});

test("Admin can view all users", async () => {
  const response = await fetch(
    `${BASE_URL}/api/admin/users`,
    {
      headers: {
        Authorization:
          `Bearer ${adminToken}`,
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
      (user) =>
        user._id.toString() ===
        recruiterOneId.toString()
    )
  );
});

test("Admin can change a user's role", async () => {
  const response = await fetch(
    `${BASE_URL}/api/admin/users/${studentId}/role`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        role: "recruiter",
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
    "recruiter"
  );
});

test("Admin can activate and deactivate a user", async () => {
  const deactivateResponse =
    await fetch(
      `${BASE_URL}/api/admin/users/${recruiterTwoId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isActive: false,
        }),
      }
    );

  const deactivateData =
    await deactivateResponse.json();

  assert.strictEqual(
    deactivateResponse.status,
    200
  );

  assert.strictEqual(
    deactivateData.success,
    true
  );

  assert.strictEqual(
    deactivateData.data.isActive,
    false
  );

  const activateResponse =
    await fetch(
      `${BASE_URL}/api/admin/users/${recruiterTwoId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isActive: true,
        }),
      }
    );

  const activateData =
    await activateResponse.json();

  assert.strictEqual(
    activateResponse.status,
    200
  );

  assert.strictEqual(
    activateData.success,
    true
  );

  assert.strictEqual(
    activateData.data.isActive,
    true
  );
});

test("Admin cannot change their own role", async () => {
  const response = await fetch(
    `${BASE_URL}/api/admin/users/${adminId}/role`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        role: "recruiter",
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

test("Admin cannot change their own account status", async () => {
  const response = await fetch(
    `${BASE_URL}/api/admin/users/${adminId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        isActive: false,
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