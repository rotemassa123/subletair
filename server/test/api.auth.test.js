import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.SUBLETAIR_DB = ":memory:";
const { createApp } = await import("../src/app.js");

let server, base;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

async function post(path, body) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

test("register returns token + user, then /me works", async () => {
  const reg = await post("/api/auth/register", { name: "Jo", email: "jo@test.com", password: "secret12" });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.token);
  assert.equal(reg.body.user.email, "jo@test.com");
  assert.equal(reg.body.user.password_hash, undefined);

  const me = await fetch(base + "/api/auth/me", { headers: { authorization: `Bearer ${reg.body.token}` } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).email, "jo@test.com");
});

test("duplicate email is rejected", async () => {
  await post("/api/auth/register", { name: "A", email: "dup@test.com", password: "secret12" });
  const again = await post("/api/auth/register", { name: "B", email: "dup@test.com", password: "secret12" });
  assert.equal(again.status, 400);
});

test("login succeeds with right password, 401 with wrong", async () => {
  await post("/api/auth/register", { name: "Li", email: "li@test.com", password: "secret12" });
  const ok = await post("/api/auth/login", { email: "li@test.com", password: "secret12" });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const bad = await post("/api/auth/login", { email: "li@test.com", password: "nope" });
  assert.equal(bad.status, 401);
});
