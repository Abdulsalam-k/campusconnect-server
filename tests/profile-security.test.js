require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");

const User = require("../src/models/User");

const BASE_URL =
  "http://localhost:5000";

const uniqueId = Date.now();

const testEmail =
  `campusconnect-profile-${uniqueId}@example.com`;

const password =
  "TestPassword123";

let authToken;
let testUserId;

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
});

test.after(async () => {
  try {
    if (testUserId) {
      await User.findByIdAndDelete(
        testUserId
      );
    }
  } catch (error) {
    console.error(
      "Profile test cleanup failed:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
});

// =====================================================
// REJECT PROFILE UPDATE WITHOUT AUTHENTICATION
// =====================================================

test(
  "Reject profile update without authentication",
  async () => {
    const response = await fetch(
      `${BASE_URL}/api/auth/profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name:
            "Unauthorized User",
        }),
      }
    );

    const data =
      await response.json();

    assert.strictEqual(
      response.status,
      401
    );

    assert.strictEqual(
      data.success,
      false
    );
  }
);

// =====================================================
// REGISTER PROFILE TEST USER
// =====================================================

test(
  "Register profile test user",
  async () => {
    const response = await fetch(
      `${BASE_URL}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name:
            "Profile Test User",
          email: testEmail,
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

    testUserId =
      data.data.id;
  }
);

// =====================================================
// LOGIN PROFILE TEST USER
// =====================================================

test(
  "Login profile test user",
  async () => {
    const response = await fetch(
      `${BASE_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
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

    authToken =
      data.token;

    assert.ok(authToken);
  }
);

// =====================================================
// AUTHENTICATED PROFILE UPDATE
// =====================================================

test(
  "Authenticated user can update their profile",
  async () => {
    const response = await fetch(
      `${BASE_URL}/api/auth/profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name:
            "Updated Profile User",
          education:
            "Federal University of Technology Akure",
          department:
            "Software Engineering",
          location:
            "Lagos",
          bio:
            "Software developer building useful applications.",
          skills: [
            "JavaScript",
            "React",
            "Node.js",
          ],
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
      data.data.name,
      "Updated Profile User"
    );

    assert.strictEqual(
      data.data.education,
      "Federal University of Technology Akure"
    );

    assert.strictEqual(
      data.data.department,
      "Software Engineering"
    );

    assert.strictEqual(
      data.data.location,
      "Lagos"
    );

    assert.deepStrictEqual(
      data.data.skills,
      [
        "JavaScript",
        "React",
        "Node.js",
      ]
    );
  }
);

// =====================================================
// PROTECTED ROLE / STATUS
// =====================================================

test(
  "Profile update cannot change protected role",
  async () => {
    const response = await fetch(
      `${BASE_URL}/api/auth/profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name:
            "Protected Role Test",
          role:
            "admin",
          isActive:
            false,
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

    assert.notStrictEqual(
      data.data.role,
      "admin"
    );

    assert.strictEqual(
      data.data.isActive,
      true
    );

    assert.strictEqual(
      data.data.name,
      "Protected Role Test"
    );
  }
);

// =====================================================
// MISSING NAME VALIDATION
// =====================================================

test(
  "Profile update rejects missing name",
  async () => {
    const response = await fetch(
      `${BASE_URL}/api/auth/profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          education:
            "Updated Education",
        }),
      }
    );

    const data =
      await response.json();

    assert.strictEqual(
      response.status,
      400
    );

    assert.strictEqual(
      data.success,
      false
    );
  }
);

// =====================================================
// INVALID IMAGE CONTENT
// =====================================================

test(
  "Profile update rejects invalid image content",
  async () => {
    const fakeImageBuffer =
      Buffer.from(
        "This is not a real JPEG image."
      );

    const boundary =
      `----CampusConnectBoundary${Date.now()}`;

    const bodyParts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="name"\r\n\r\n`,
      "Invalid Image Test\r\n",

      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="profileImage"; filename="test.jpg"\r\n`,
      "Content-Type: image/jpeg\r\n\r\n",

      fakeImageBuffer,

      `\r\n--${boundary}--\r\n`,
    ];

    const body =
      Buffer.concat(
        bodyParts.map((part) =>
          Buffer.isBuffer(part)
            ? part
            : Buffer.from(part)
        )
      );

    const response = await fetch(
      `${BASE_URL}/api/auth/profile`,
      {
        method: "PUT",
        headers: {
          Authorization:
            `Bearer ${authToken}`,
          "Content-Type":
            `multipart/form-data; boundary=${boundary}`,
        },
        body,
      }
    );

    const data =
      await response.json();

    assert.strictEqual(
      response.status,
      400
    );

    assert.strictEqual(
      data.success,
      false
    );

    assert.match(
      data.message,
      /Invalid image file/i
    );
  }
);

// =====================================================
// USER MODEL SKILLS VALIDATION
// =====================================================

test(
  "User model rejects an invalid skill",
  async () => {
    const invalidUser =
      new User({
        name:
          "Invalid Skill Test",

        email:
          `invalid-skill-${Date.now()}@example.com`,

        password:
          "TestPassword123",

        skills: [
          "JavaScript",
          "",
        ],
      });

    await assert.rejects(
      async () => {
        await invalidUser.validate();
      },
      (error) => {
        assert.ok(error);

        assert.ok(
          error.errors.skills
        );

        assert.strictEqual(
          error.errors.skills.kind,
          "user defined"
        );

        return true;
      }
    );
  }
);