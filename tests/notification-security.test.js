require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");

const User = require("../src/models/User");
const Notification = require("../src/models/Notification");

const BASE_URL =
  "http://localhost:5000";

const uniqueId = Date.now();

const userOneEmail =
  `campusconnect-notification-one-${uniqueId}@example.com`;

const userTwoEmail =
  `campusconnect-notification-two-${uniqueId}@example.com`;

const password =
  "TestPassword123";

let userOneToken;
let userTwoToken;

let userOneId;
let userTwoId;
let notificationId;

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
    if (notificationId) {
      await Notification.findByIdAndDelete(
        notificationId
      );
    }

    if (userOneId) {
      await Notification.deleteMany({
        userId: userOneId,
      });

      await User.findByIdAndDelete(
        userOneId
      );
    }

    if (userTwoId) {
      await Notification.deleteMany({
        userId: userTwoId,
      });

      await User.findByIdAndDelete(
        userTwoId
      );
    }
  } catch (error) {
    console.error(
      "Notification test cleanup failed:",
      error.message
    );
  } finally {
    await mongoose.connection.close();
  }
});

test("Register notification test user one", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Notification Test User One",
        email: userOneEmail,
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

  userOneId =
    data.data.id;
});

test("Login notification test user one", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userOneEmail,
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

  userOneToken =
    data.token;
});

test("Register notification test user two", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Notification Test User Two",
        email: userTwoEmail,
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

  userTwoId =
    data.data.id;
});

test("Login notification test user two", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userTwoEmail,
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

  userTwoToken =
    data.token;
});

test("Create a notification for user one", async () => {
  const notification =
    await Notification.create({
      userId: userOneId,
      title: "Test Notification",
      message:
        "This is a notification security test.",
      type: "system",
      isRead: false,
    });

  notificationId =
    notification._id.toString();

  assert.ok(notificationId);
});

test("User one can view their notifications", async () => {
  const response = await fetch(
    `${BASE_URL}/api/notifications`,
    {
      headers: {
        Authorization:
          `Bearer ${userOneToken}`,
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
      (notification) =>
        notification._id.toString() ===
        notificationId
    )
  );
});

test("User one can mark their notification as read", async () => {
  const response = await fetch(
    `${BASE_URL}/api/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: {
        Authorization:
          `Bearer ${userOneToken}`,
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
    data.data.isRead,
    true
  );
});

test("User two cannot mark user one's notification as read", async () => {
  const resetNotification =
  await Notification.findByIdAndUpdate(
    notificationId,
    {
      isRead: false,
    },
    {
      returnDocument: "after",
    }
  );

  assert.strictEqual(
    resetNotification.isRead,
    false
  );

  const response = await fetch(
    `${BASE_URL}/api/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: {
        Authorization:
          `Bearer ${userTwoToken}`,
      },
    }
  );

  const data =
    await response.json();

  assert.strictEqual(
    response.status,
    404
  );

  assert.strictEqual(
    data.success,
    false
  );
});

test("User two cannot delete user one's notification", async () => {
  const response = await fetch(
    `${BASE_URL}/api/notifications/${notificationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization:
          `Bearer ${userTwoToken}`,
      },
    }
  );

  const data =
    await response.json();

  assert.strictEqual(
    response.status,
    404
  );

  assert.strictEqual(
    data.success,
    false
  );
});

test("User one can delete their own notification", async () => {
  const response = await fetch(
    `${BASE_URL}/api/notifications/${notificationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization:
          `Bearer ${userOneToken}`,
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