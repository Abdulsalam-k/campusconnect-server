require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");

const User = require("../src/models/User");

const BASE_URL =
  "http://localhost:5000";

const testEmail =
  `campusconnect-student-test-${Date.now()}@example.com`;

const testPassword =
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
  } finally {
    await mongoose.connection.close();
  }
});

test("Register a student test user", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Authorization Test Student",
        email: testEmail,
        password: testPassword,
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

  testUserId = data.data.id;
});

test("Login as student test user", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
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

  authToken = data.token;
});

test("Reject student access to admin dashboard", async () => {
  const response = await fetch(
    `${BASE_URL}/api/admin/dashboard`,
    {
      headers: {
        Authorization:
          `Bearer ${authToken}`,
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