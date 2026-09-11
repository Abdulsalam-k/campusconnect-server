const test = require("node:test");
const assert = require("node:assert");

test("CampusConnect API health check", async () => {
  const response = await fetch(
    "http://localhost:5000/api/health"
  );

  assert.strictEqual(response.status, 200);

  const data = await response.json();

  assert.strictEqual(data.success, true);
  assert.strictEqual(
    data.message,
    "CampusConnect API is running 🚀"
  );
});