import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

test("password recovery requires a code, never signs in, and clears old website sessions", { timeout: 120000 }, async t => {
  const reserve = http.createServer(); reserve.listen(0, "127.0.0.1"); await once(reserve, "listening");
  const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const calls = [];
  let smsEnabled = false;
  let completed = false;
  const challenge = { challengeId: "password-reset-challenge", method: "email", expiresAt: new Date(Date.now() + 300000).toISOString(),
    resendAvailableAt: new Date(Date.now() + 30000).toISOString(), message: "Якщо акаунт існує та контакт підтверджено, ми надішлемо код." };
  const backend = http.createServer(async (request, response) => {
    let body = ""; for await (const chunk of request) body += chunk;
    const input = body ? JSON.parse(body) : null;
    calls.push({ path: request.url, input }); response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth/password-reset/methods") { response.end(JSON.stringify({ methods: smsEnabled ? ["email", "sms"] : ["email"] })); return; }
    if (request.url === "/api/auth/password-reset/request") {
      if (!["email", "sms"].includes(input.verificationMethod)) { response.writeHead(400); response.end(JSON.stringify({ message: "Оберіть спосіб підтвердження." })); return; }
      if (input.verificationMethod === "sms" && !smsEnabled) { response.writeHead(400); response.end(JSON.stringify({ message: "SMS тимчасово недоступні." })); return; }
      response.end(JSON.stringify({ ...challenge, method: input.verificationMethod })); return;
    }
    if (request.url === "/api/auth/password-reset/complete") {
      if (input.code !== "123456") { response.writeHead(401); response.end("{}"); return; }
      assert.equal(input.challengeId, challenge.challengeId); assert.equal(input.newPassword, "ReplacementPassword123!");
      completed = true; response.writeHead(204); response.end(); return;
    }
    if (request.url === "/api/auth/login") {
      response.end(JSON.stringify({ challenge: { challengeId: "normal-2fa", methods: ["authenticator"], maskedEmail: "t***@example.test", expiresAt: challenge.expiresAt } })); return;
    }
    if (request.url === "/api/auth/external/providers") { response.end("[]"); return; }
    response.writeHead(404); response.end("{}");
  });
  backend.listen(0, "127.0.0.1"); await once(backend, "listening");
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { windowsHide: true, env: { ...process.env, NODE_ENV: "production", TREBA_API_URL: `http://127.0.0.1:${backend.address().port}` }, stdio: ["ignore", "pipe", "pipe"] });
  let output = ""; child.stdout.on("data", value => output += value); child.stderr.on("data", value => output += value);
  t.after(async () => { child.kill("SIGTERM"); backend.closeAllConnections(); await new Promise(resolve => backend.close(resolve)); });
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) { try { if ((await fetch(origin + "/shop-api/session")).status === 401) { ready = true; break; } } catch {} await delay(500); }
  assert.ok(ready, output);
  const post = (input, requestOrigin = origin) => fetch(origin + "/shop-api/session", { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin,
    Cookie: "treba_access=old-access; treba_refresh=old-refresh; treba_staff_handoff=old-handoff" }, body: JSON.stringify(input) });

  const loginPage = await (await fetch(origin + "/login")).text(); assert.match(loginPage, /Забули пароль/);
  assert.deepEqual(await (await fetch(origin + "/shop-api/password-reset/methods")).json(), { methods: ["email"] });
  const missing = await post({ action: "password-reset-request", email: "customer@example.test" }); assert.equal(missing.status, 400);
  const smsOff = await post({ action: "password-reset-request", email: "customer@example.test", verificationMethod: "sms" }); assert.equal(smsOff.status, 400);
  assert.match((await smsOff.json()).message, /SMS/);

  const requested = await post({ action: "password-reset-request", email: "customer@example.test", verificationMethod: "email", newPassword: "must-not-be-forwarded" });
  assert.equal(requested.status, 200); assert.deepEqual((await requested.json()).challenge, challenge);
  assert.equal(requested.headers.getSetCookie().length, 0); assert.equal(completed, false);
  assert.deepEqual(calls.at(-1), { path: "/api/auth/password-reset/request", input: { email: "customer@example.test", verificationMethod: "email" } });

  const wrong = await post({ action: "password-reset-complete", challengeId: challenge.challengeId, code: "000000", newPassword: "ReplacementPassword123!" });
  assert.equal(wrong.status, 401); assert.equal(wrong.headers.getSetCookie().length, 0); assert.equal(completed, false);
  assert.match((await wrong.json()).message, /код/);

  smsEnabled = true;
  assert.deepEqual((await (await fetch(origin + "/shop-api/password-reset/methods")).json()).methods, ["email", "sms"]);
  const sms = await post({ action: "password-reset-request", email: "customer@example.test", verificationMethod: "sms" });
  assert.equal((await sms.json()).challenge.method, "sms"); assert.equal(sms.headers.getSetCookie().length, 0);

  const confirmed = await post({ action: "password-reset-complete", challengeId: challenge.challengeId, code: "123456", newPassword: "ReplacementPassword123!" });
  assert.equal(confirmed.status, 200); assert.deepEqual(await confirmed.json(), { ok: true }); assert.equal(completed, true);
  const cookies = confirmed.headers.getSetCookie();
  for (const name of ["treba_access", "treba_refresh", "treba_expiry", "treba_remember", "treba_staff_handoff"]) {
    const cookie = cookies.find(value => value.startsWith(name + "=")); assert.ok(cookie); assert.match(cookie, /Max-Age=0/i);
  }
  assert.ok(!cookies.some(value => /treba_access=.+?;/.test(value) && !/Max-Age=0/i.test(value)));

  const login = await post({ action: "login", email: "customer@example.test", password: "ReplacementPassword123!" });
  assert.equal((await login.json()).challenge.challengeId, "normal-2fa"); assert.equal(login.headers.getSetCookie().length, 0);
  const before = calls.length;
  assert.equal((await post({ action: "password-reset-request", email: "customer@example.test", verificationMethod: "email" }, "https://untrusted.example")).status, 403);
  assert.equal(calls.length, before);
});
