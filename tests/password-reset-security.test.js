require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../src/models/User");

const BASE_URL =
  "http://localhost:5000";

const uniqueId = Date.now();

const testEmail =
  `campusconnect-reset-${uniqueId}@example.com`;

const originalPassword =
  "OldPassword123";

const newPassword =
  "NewPassword123";

const validResetToken =
  crypto.randomBytes(32).toString("hex");

const expiredResetToken =
  crypto.randomBytes(32).toString("hex");

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

function hashResetToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

test.before(async () => {
  await connectTestDatabase();

  const hashedPassword =
    await bcrypt.hash(
      originalPassword,
      10
    );

  const user =
    await User.create({
      name: "Password Reset Test User",
      email: testEmail,
      password: hashedPassword,
      role: "student",
      isActive: true,
    });

  testUserId =
    user._id;
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
      "Password reset test cleanup failed:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
});

test("Reject password reset with an invalid token", async () => {
  const invalidToken =
    crypto.randomBytes(32).toString("hex");

  const response = await fetch(
    `${BASE_URL}/api/auth/reset-password/${invalidToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
        confirmPassword: newPassword,
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

  assert.strictEqual(
    data.message,
    "This reset link is invalid or has expired."
  );
});

test("Reject password reset with an expired token", async () => {
  await User.findByIdAndUpdate(
    testUserId,
    {
      passwordResetTokenHash:
        hashResetToken(
          expiredResetToken
        ),
      passwordResetExpires:
        new Date(
          Date.now() - 60 * 1000
        ),
    }
  );

  const response = await fetch(
    `${BASE_URL}/api/auth/reset-password/${expiredResetToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
        confirmPassword: newPassword,
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

  assert.strictEqual(
    data.message,
    "This reset link is invalid or has expired."
  );
});

test("Successfully reset password with a valid token", async () => {
  await User.findByIdAndUpdate(
    testUserId,
    {
      passwordResetTokenHash:
        hashResetToken(
          validResetToken
        ),
      passwordResetExpires:
        new Date(
          Date.now() + 15 * 60 * 1000
        ),
    }
  );

  const response = await fetch(
    `${BASE_URL}/api/auth/reset-password/${validResetToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
        confirmPassword: newPassword,
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
    "Password reset successful. You can now log in with your new password."
  );

  const updatedUser =
    await User.findById(
      testUserId
    );

  assert.ok(updatedUser);

  assert.strictEqual(
    updatedUser.passwordResetTokenHash,
    ""
  );

  assert.strictEqual(
    updatedUser.passwordResetExpires,
    null
  );

  const newPasswordMatches =
    await bcrypt.compare(
      newPassword,
      updatedUser.password
    );

  assert.strictEqual(
    newPasswordMatches,
    true
  );

  const oldPasswordMatches =
    await bcrypt.compare(
      originalPassword,
      updatedUser.password
    );

  assert.strictEqual(
    oldPasswordMatches,
    false
  );
});

test("Cannot reuse a password reset token after successful reset", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/reset-password/${validResetToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: "AnotherPassword123",
        confirmPassword:
          "AnotherPassword123",
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
});

test("Reject password reset when passwords do not match", async () => {
  const mismatchToken =
    crypto.randomBytes(32).toString("hex");

  await User.findByIdAndUpdate(
    testUserId,
    {
      passwordResetTokenHash:
        hashResetToken(
          mismatchToken
        ),
      passwordResetExpires:
        new Date(
          Date.now() + 15 * 60 * 1000
        ),
    }
  );

  const response = await fetch(
    `${BASE_URL}/api/auth/reset-password/${mismatchToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
        confirmPassword:
          "DifferentPassword123",
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

  assert.strictEqual(
    data.message,
    "Passwords do not match."
  );
});
