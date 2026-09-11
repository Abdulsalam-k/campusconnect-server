require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");

const BASE_URL =
  "http://localhost:5000";

test("Reject /me request without authentication token", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/me`
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
});

test("Reject /me request with invalid authentication token", async () => {
  const response = await fetch(
    `${BASE_URL}/api/auth/me`,
    {
      headers: {
        Authorization:
          "Bearer invalid-token",
      },
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
});
