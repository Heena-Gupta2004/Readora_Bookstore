import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../server.js";

test("GET /api/health returns ok", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
});
