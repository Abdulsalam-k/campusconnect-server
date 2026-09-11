require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");

const User = require("../src/models/User");

const BASE_URL =
  "http://localhost:5000";

const testEmail =
  `campusconnect-test-${Date.now()}@example.com`;

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
  } catch (error) {
    console.error(
      "Test cleanup failed:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
});

test("Register a new user", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "CampusConnect Test User",
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

  assert.strictEqual(
    data.message,
    "Account created successfully."
  );

  assert.ok(data.data.id);

  testUserId = data.data.id;
});

test("Login with the registered user", async () => {
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
    data.message,
    "Login successful."
  );

  assert.ok(data.token);

  assert.strictEqual(
    data.data.email,
    testEmail
  );

  authToken = data.token;
});

test("Get authenticated user with /me", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/me`,
    {
      method: "GET",
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
    200
  );

  assert.strictEqual(
    data.success,
    true
  );

  assert.strictEqual(
    data.data.email,
    testEmail
  );

  assert.strictEqual(
    data.data.name,
    "CampusConnect Test User"
  );
});