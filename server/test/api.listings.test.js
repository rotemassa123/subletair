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

async function register(email) {
  const res = await fetch(base + "/api/auth/register", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "H", email, password: "secret12" }),
  });
  return (await res.json()).token;
}

test("create listing (multipart, with photo) then it appears publicly", async () => {
  const token = await register("host1@test.com");
  const fd = new FormData();
  fd.set("title", "Test cabin");
  fd.set("price", "150");
  fd.set("cat", "cabin");
  fd.set("photo", new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }), "p.jpg");

  const create = await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd });
  assert.equal(create.status, 201);
  const made = await create.json();
  assert.equal(made.title, "Test cabin");
  assert.match(made.image, /^\/uploads\//);

  const list = await (await fetch(base + "/api/listings?category=cabin")).json();
  assert.ok(list.some((l) => l.id === made.id));
});

test("only the owner can edit or delete", async () => {
  const owner = await register("owner@test.com");
  const other = await register("other@test.com");
  const fd = new FormData();
  fd.set("title", "Mine"); fd.set("price", "99"); fd.set("cat", "loft");
  const made = await (await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${owner}` }, body: fd })).json();

  const forbidden = await fetch(base + `/api/listings/${made.id}`, {
    method: "PATCH", headers: { authorization: `Bearer ${other}`, "content-type": "application/json" },
    body: JSON.stringify({ title: "Hacked" }),
  });
  assert.equal(forbidden.status, 403);

  const del = await fetch(base + `/api/listings/${made.id}`, { method: "DELETE", headers: { authorization: `Bearer ${owner}` } });
  assert.equal(del.status, 200);
});

test("save toggle is per-user and requires auth", async () => {
  const token = await register("saver@test.com");
  const noAuth = await fetch(base + "/api/listings/1/save", { method: "POST" });
  assert.equal(noAuth.status, 401);
  const on = await (await fetch(base + "/api/listings/1/save", { method: "POST", headers: { authorization: `Bearer ${token}` } })).json();
  assert.equal(on.saved, true);
  const off = await (await fetch(base + "/api/listings/1/save", { method: "POST", headers: { authorization: `Bearer ${token}` } })).json();
  assert.equal(off.saved, false);
});

test("disallowed file type is rejected with 400", async () => {
  const token = await register("badfile@test.com");
  const fd = new FormData();
  fd.set("title", "Bad upload"); fd.set("price", "100"); fd.set("cat", "cabin");
  fd.set("photo", new Blob(["hello"], { type: "text/plain" }), "note.txt");
  const res = await fetch(base + "/api/listings", {
    method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd,
  });
  assert.equal(res.status, 400);
});

test("nonexistent category is rejected with 400", async () => {
  const token = await register("badcat@test.com");
  const fd = new FormData();
  fd.set("title", "Bad cat"); fd.set("price", "100"); fd.set("cat", "nope");
  const res = await fetch(base + "/api/listings", {
    method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd,
  });
  assert.equal(res.status, 400);
});

test("non-numeric price is rejected with 400", async () => {
  const token = await register("badprice@test.com");
  const fd = new FormData();
  fd.set("title", "Bad price"); fd.set("price", "abc"); fd.set("cat", "cabin");
  const res = await fetch(base + "/api/listings", {
    method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd,
  });
  assert.equal(res.status, 400);
});

test("listings/mine returns only my listings", async () => {
  const token = await register("mine@test.com");
  const fd = new FormData();
  fd.set("title", "Only mine"); fd.set("price", "120"); fd.set("cat", "city");
  await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd });
  const mine = await (await fetch(base + "/api/listings/mine", { headers: { authorization: `Bearer ${token}` } })).json();
  assert.ok(mine.length >= 1);
  assert.ok(mine.every((l) => l.title === "Only mine"));
});
