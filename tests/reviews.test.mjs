import { test } from "node:test";
import assert from "node:assert/strict";
import { startDeliveryFixture } from "./helpers/delivery-fixture.mjs";

test("review proxy protects sessions and writes, forwards purchase checks, and refreshes awaiting/mine", { timeout: 120000 }, async t => {
  const fixture = await startDeliveryFixture({ fulfilled: true }); t.after(() => fixture.close());
  const { origin } = fixture;
  for (const path of ["/shop-api/reviews/awaiting", "/shop-api/reviews/mine"])
    assert.equal((await fetch(origin + path)).status, 401);
  const login = await fetch(origin + "/shop-api/session", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email: "fixture@example.test", password: "fixture-only" }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  const request = (path, method = "GET", body, from = origin) => fetch(origin + path, { method,
    headers: { Cookie: cookie, Origin: from, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const awaiting = await request("/shop-api/reviews/awaiting?page=1");
  assert.match(awaiting.headers.get("cache-control"), /no-store/);
  const item = (await awaiting.json()).items[0];
  assert.equal(item.productId, fixture.variantId);
  const input = { orderItemId: item.orderItemId, productId: item.productId, rating: 5, title: "Покупка", comment: "Все добре!" };
  const count = fixture.requests.length;
  assert.equal((await request("/shop-api/reviews", "POST", input, "https://foreign.example")).status, 403);
  assert.equal((await request("/shop-api/reviews", "POST", input, "")).status, 403);
  assert.equal(fixture.requests.length, count);
  assert.equal((await request("/shop-api/reviews", "POST", { ...input, orderItemId: fixture.quoteId })).status, 409);
  assert.equal((await request("/shop-api/reviews", "POST", { ...input, comment: " " })).status, 400);
  const saved = await request("/shop-api/reviews", "POST", input);
  assert.equal(saved.status, 200); assert.equal((await saved.json()).status, "PENDING");
  assert.deepEqual((await (await request("/shop-api/reviews/awaiting")).json()).items, []);
  const mine = (await (await request("/shop-api/reviews/mine")).json()).items;
  assert.equal(mine.length, 1); assert.equal(mine[0].comment, input.comment);
  assert.equal((await request("/shop-api/reviews", "POST", input)).status, 409);
  for (const path of ["/shop-api/reviews/moderate", "/shop-api/reviews/mine", "/shop-api/reviews/awaiting"])
    assert.equal((await request(path, "POST", input)).status, 404);
  assert.ok(fixture.requests.filter(item => item.path.startsWith("/api/v1/reviews")).every(item => item.authorization === "Bearer fixture-access"));
});
