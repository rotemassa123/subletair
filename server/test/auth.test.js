import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/auth.js";

test("hash + verify password round-trips", () => {
  const h = hashPassword("hunter2");
  assert.notEqual(h, "hunter2");
  assert.equal(verifyPassword("hunter2", h), true);
  assert.equal(verifyPassword("wrong", h), false);
});

test("sign + verify token round-trips", () => {
  const token = signToken({ id: 7 });
  const payload = verifyToken(token);
  assert.equal(payload.id, 7);
});

test("verifyToken returns null on garbage", () => {
  assert.equal(verifyToken("not-a-token"), null);
});
