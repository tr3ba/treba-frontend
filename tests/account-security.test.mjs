import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

test("account credential changes bind OAuth and MFA to the current session", async t => {
  const portServer = http.createServer(); portServer.listen(0, "127.0.0.1"); await once(portServer, "listening");
  const port = portServer.address().port; await new Promise(resolve => portServer.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const userId = "11111111-1111-1111-1111-111111111111";
  const otherId = "22222222-2222-2222-2222-222222222222";
  const challengeId = "33333333-3333-3333-3333-333333333333";
  const challenge = { challengeId, methods: ["email", "authenticator"], maskedEmail: "ow***@example.test", expiresAt: new Date(Date.now() + 600000).toISOString() };
  const calls = [];
  let settingsUnavailable = false, providerUnavailable = false;
  const backend = http.createServer(async (request, response) => {
    let raw = ""; for await (const chunk of request) raw += chunk;
    const body = raw ? JSON.parse(raw) : undefined;
    calls.push({ path: request.url, body, authorization: request.headers.authorization });
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth/external/providers" && providerUnavailable) { response.writeHead(503); return response.end("{}"); }
    if (request.url === "/api/security" && settingsUnavailable) { response.writeHead(503); return response.end("{}"); }
    if (request.url === "/api/auth/external/providers") return response.end(JSON.stringify(["google", "facebook"].map(name => ({ name, clientId: name + "-client", authorizationUrl: name === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://www.facebook.com/dialog/oauth", redirectUri: `${origin}/api/auth/external/${name}/callback`, scopes: ["email"] }))));
    if (request.url === "/api/auth/refresh") return response.end(JSON.stringify({ accessToken: "rotated-access", refreshToken: "rotated-refresh", expiresAt: new Date(Date.now() + 3600000).toISOString(), role: "Customer" }));
    if (request.url === "/api/users/me") return response.end(JSON.stringify({ id: request.headers.authorization === "Bearer other-access" ? otherId : userId, email: "owner@example.test", role: request.headers.authorization === "Bearer staff-access" ? "Manager" : "Customer" }));
    if (request.url === "/api/security") return response.end(JSON.stringify({ emailVerified: true, emailTwoFactorEnabled: true, authenticatorEnabled: false }));
    if (request.url === "/api/security/email/setup") return response.end(JSON.stringify({ challengeId, maskedEmail: "ow***@example.test" }));
    if (request.url === "/api/security/email/confirm") return response.end(JSON.stringify({ emailVerified: true, emailTwoFactorEnabled: true }));
    if (request.url === "/api/auth/reauthenticate" || request.url === "/api/auth/external/reauth/code") return response.end(JSON.stringify({ challenge }));
    if (request.url === "/api/auth/2fa/email/send") { response.writeHead(204); return response.end(); }
    if (request.url === "/api/users/me/email-change" || request.url === "/api/users/me/external-link-confirmation") return response.end(JSON.stringify({ challengeId, expiresAt: challenge.expiresAt }));
    if (request.url === "/api/users/me/email-change/confirm") { response.writeHead(204); return response.end(); }
    if (request.url === "/api/auth/external/link/code") return response.end(JSON.stringify({ success: true }));
    response.writeHead(404); response.end("{}");
  });
  backend.listen(0, "127.0.0.1"); await once(backend, "listening");
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { windowsHide: true, env: { ...process.env, NODE_ENV: "production", TREBA_STORE_ORIGIN: origin, TREBA_API_URL: `http://127.0.0.1:${backend.address().port}` }, stdio: ["ignore", "pipe", "pipe"] });
  let output = ""; child.stdout.on("data", data => output += data); child.stderr.on("data", data => output += data);
  t.after(async () => { child.kill("SIGTERM"); backend.closeAllConnections(); await new Promise(resolve => backend.close(resolve)); });
  let ready = false;
  for (let i = 0; i < 90; i++) { try { if ((await fetch(origin + "/shop-api/session")).status === 401) { ready = true; break; } } catch {} await delay(500); }
  assert.ok(ready, output);
  const expiry = encodeURIComponent(new Date(Date.now() + 3600000).toISOString());
  const customer = `treba_access=customer-access; treba_expiry=${expiry}; treba_refresh=current-refresh`;
  const staff = `treba_staff_access=staff-access; treba_staff_expiry=${expiry}; treba_staff_refresh=staff-refresh`;
  const other = `treba_access=other-access; treba_expiry=${expiry}`;
  const cookies = response => response.headers.getSetCookie().filter(value => !/Max-Age=0/i.test(value)).map(value => value.split(";")[0]).join("; ");
  const post = (path, body, cookie = customer, host = origin) => fetch(origin + path, { method: "POST", headers: { Origin: host, Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body), redirect: "manual" });
  const security = (action, values = {}, cookie = customer, scope = "customer") => post("/shop-api/account-security", { action, scope, ...values }, cookie);
  const noSessionWrites = response => assert.ok(!response.headers.getSetCookie().some(value => /^treba_(staff_)?(access|refresh)=.+;/i.test(value) && !/Max-Age=0/i.test(value)));

  await t.test("unauthenticated and wrong-origin writes never forward an operation", async () => {
    const before = calls.length;
    assert.equal((await post("/shop-api/account-security", { action: "begin-email", scope: "customer", target: "new@example.test" }, customer, "https://foreign.example")).status, 403);
    assert.equal((await security("begin-email", {}, "")).status, 401);
    assert.equal(calls.length, before);
  });
  await t.test("customer and staff begin send the raw MFA proof without issuing a session", async () => {
    for (const [cookie, scope] of [[customer, "customer"], [staff, "staff"]]) {
      const primary = await security("reauthenticate", { password: "fixture-password" }, cookie, scope);
      assert.deepEqual(await primary.json(), { challenge }); noSessionWrites(primary);
      const sent = await security("send-mfa", { challengeId }, cookie, scope); assert.equal(sent.status, 200);
      const proof = { challengeId, method: "email", code: "123456" };
      const begin = await security("begin-email", { target: "new@example.test", secondFactor: proof }, cookie, scope);
      assert.equal(begin.status, 200); noSessionWrites(begin);
      assert.deepEqual(calls.at(-1).body, { target: "new@example.test", secondFactor: proof });
    }
    assert.ok(!calls.some(call => call.path === "/api/auth/2fa/verify"));
  });
  await t.test("email confirmation clears a refreshed session rather than restoring it", async () => {
    const expired = `treba_access=old; treba_expiry=${encodeURIComponent(new Date(0).toISOString())}; treba_refresh=current-refresh`;
    const result = await security("confirm-email", { challengeId, currentEmailCode: "123456", newEmailCode: "654321" }, expired);
    assert.equal(result.status, 200);
    assert.ok(result.headers.getSetCookie().some(value => value.startsWith("treba_access=;") && /Max-Age=0/i.test(value)));
    noSessionWrites(result);
  });
  await t.test("email-factor fallback requires a fresh sign-in after activation for customer and staff", async () => {
    for (const [cookie, scope] of [[customer, "customer"], [staff, "staff"]]) {
      const started = await security("email-setup", {}, cookie, scope);
      assert.equal((await started.json()).challengeId, challengeId);
      const confirmed = await security("email-confirm", { challengeId, code: "123456" }, cookie, scope);
      assert.equal(confirmed.status, 200); noSessionWrites(confirmed);
      assert.ok(confirmed.headers.getSetCookie().some(value => value.startsWith(scope === "staff" ? "treba_staff_access=;" : "treba_access=;") && /Max-Age=0/i.test(value)));
    }
  });
  await t.test("upstream failures preserve a rotated session for retry after the refresh cache expires", async () => {
    const expired = `treba_access=old; treba_expiry=${encodeURIComponent(new Date(0).toISOString())}; treba_refresh=recoverable-fixture-refresh`;
    settingsUnavailable = true;
    const failed = await fetch(origin + "/shop-api/account-security?scope=customer", { headers: { Cookie: expired } });
    settingsUnavailable = false;
    assert.equal(failed.status, 503);
    assert.ok(failed.headers.getSetCookie().some(value => value.startsWith("treba_access=rotated-access;")));
    await delay(5200);
    const retry = await fetch(origin + "/shop-api/account-security?scope=customer", { headers: { Cookie: cookies(failed) } });
    assert.equal(retry.status, 200);
    providerUnavailable = true;
    const failedStart = await post("/shop-api/external/google/start", { scope: "customer", purpose: "reauth", changeKind: "email", target: "new@example.test" },
      `treba_access=old; treba_expiry=${encodeURIComponent(new Date(0).toISOString())}; treba_refresh=provider-outage-fixture-refresh`);
    providerUnavailable = false;
    assert.equal(failedStart.status, 503);
    assert.ok(failedStart.headers.getSetCookie().some(value => value.startsWith("treba_access=rotated-access;")));
  });
  async function start(provider, purpose = "link") {
    const response = await post(`/shop-api/external/${provider}/start`, { scope: "customer", purpose, changeKind: purpose === "link" ? "link" : "email", target: purpose === "link" ? provider : "new@example.test", confirmationChallengeId: challengeId, confirmationCode: "123456" });
    assert.equal(response.status, 200);
    const url = new URL((await response.json()).url);
    assert.ok(!url.href.includes("123456") && !url.href.includes(challengeId));
    assert.ok(response.headers.getSetCookie().some(value => /HttpOnly/i.test(value) && /SameSite=lax/i.test(value)));
    return { url, cookie: cookies(response) };
  }
  async function callback(provider, flow, session = customer, extra = {}) {
    const query = new URLSearchParams({ state: flow.url.searchParams.get("state"), code: "provider-code", ...extra });
    return fetch(`${origin}/shop-api/external/${provider}/callback?${query}`, { redirect: "manual", headers: { Cookie: `${session}; ${flow.cookie}` } });
  }
  for (const provider of ["google", "facebook"]) await t.test(`${provider} linking exchanges code only for the original account`, async () => {
    const flow = await start(provider);
    const response = await callback(provider, flow);
    assert.equal(response.status, 303); assert.equal(new URL(response.headers.get("location")).pathname, "/account"); noSessionWrites(response);
    const call = calls.findLast(call => call.path === "/api/auth/external/link/code");
    assert.equal(call.body.login.provider, provider); assert.equal(call.body.confirmationChallengeId, challengeId); assert.equal(call.body.confirmationCode, "123456");
    assert.equal(call.authorization, "Bearer customer-access");
    const pending = await fetch(origin + "/shop-api/account-security?scope=customer", { headers: { Cookie: `${customer}; ${cookies(response)}` } });
    assert.equal((await pending.json()).pending.linked, provider);
    assert.ok(!calls.some(call => call.path === "/api/auth/external/code"));
  });
  await t.test("state mismatch, missing session, changed account and cancellation cannot link", async () => {
    for (const [session, extra] of [[other, {}], ["", {}], [customer, { state: "x".repeat(43) }], [customer, { error: "access_denied" }]]) {
      const flow = await start("google");
      const before = calls.filter(call => call.path === "/api/auth/external/link/code").length;
      const response = await callback("google", flow, session, extra);
      assert.equal(response.status, 303); noSessionWrites(response);
      assert.equal(calls.filter(call => call.path === "/api/auth/external/link/code").length, before);
    }
  });
  await t.test("OAuth reauthentication resumes the MFA step without creating login cookies", async () => {
    const flow = await start("google", "reauth");
    const response = await callback("google", flow); noSessionWrites(response);
    assert.equal(calls.at(-1).path, "/api/auth/external/reauth/code");
    const pending = await fetch(origin + "/shop-api/account-security?scope=customer", { headers: { Cookie: `${customer}; ${cookies(response)}` } });
    const data = await pending.json();
    assert.deepEqual(data.pending.challenge, challenge); assert.equal(data.pending.target, "new@example.test");
  });
});
