import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

test("registration proxy requires contact verification before creating a website session", { timeout: 120000 }, async t => {
  const reserve = http.createServer(); reserve.listen(0, "127.0.0.1"); await once(reserve, "listening");
  const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const calls = [];
  let smsEnabled = false;
  let verified = false;
  const challenge = { challengeId: "pending-registration", method: "email", maskedDestination: "n***@example.test",
    expiresAt: new Date(Date.now() + 300000).toISOString(), resendAvailableAt: new Date(Date.now() + 30000).toISOString() };
  const authentication = { userId: "customer", firstName: "Олена", lastName: "Коваль", email: "new@example.test", role: "Customer",
    accessToken: "private-registration-access", refreshToken: "private-registration-refresh", expiresAt: new Date(Date.now() + 600000).toISOString() };
  const backend = http.createServer(async (request, response) => {
    let body = ""; for await (const chunk of request) body += chunk;
    const input = body ? JSON.parse(body) : null;
    calls.push({ path: request.url, input });
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth/registration/methods") { response.end(JSON.stringify({ methods: smsEnabled ? ["email", "sms"] : ["email"] })); return; }
    if (request.url === "/api/auth/register") {
      if (!["email", "sms"].includes(input.verificationMethod)) { response.writeHead(400); response.end(JSON.stringify({ title: "Оберіть спосіб підтвердження." })); return; }
      if (input.verificationMethod === "sms" && !smsEnabled) { response.writeHead(400); response.end(JSON.stringify({ message: "SMS вимкнено. Оберіть пошту." })); return; }
      response.end(JSON.stringify({ ...challenge, method: input.verificationMethod })); return;
    }
    if (request.url === "/api/auth/registration/resend") { response.end(JSON.stringify({ ...challenge, challengeId: "renewed-registration" })); return; }
    if (request.url === "/api/auth/registration/verify") {
      if (input.code !== "123456") { response.writeHead(401); response.end("{}"); return; }
      verified = true; response.end(JSON.stringify(authentication)); return;
    }
    if (request.url === "/api/users/me" && verified) { response.end(JSON.stringify(authentication)); return; }
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
  const post = (input, requestOrigin = origin) => fetch(origin + "/shop-api/session", { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin }, body: JSON.stringify(input) });
  const registration = { action: "register", email: "new@example.test", password: "Password123!", firstName: "Олена", lastName: "Коваль", phone: "+380671234567" };

  assert.deepEqual(await (await fetch(origin + "/shop-api/registration/methods")).json(), { methods: ["email"] });
  const missing = await post(registration); assert.equal(missing.status, 400);
  const disabled = await post({ ...registration, verificationMethod: "sms" });
  assert.equal(disabled.status, 400); assert.match((await disabled.json()).message, /SMS вимкнено/);

  const pending = await post({ ...registration, verificationMethod: "email" });
  assert.equal(pending.status, 200); assert.deepEqual((await pending.json()).challenge, challenge);
  assert.equal(pending.headers.getSetCookie().length, 0);
  const sent = calls.at(-1).input;
  assert.equal(sent.verificationMethod, "email"); assert.equal(sent.phoneNumber, registration.phone); assert.equal(sent.roleName, "Customer");
  assert.equal((await fetch(origin + "/shop-api/session")).status, 401);

  const invalid = await post({ action: "registration-verify", challengeId: challenge.challengeId, code: "000000" });
  assert.equal(invalid.status, 401); assert.equal(invalid.headers.getSetCookie().length, 0);
  const resent = await post({ action: "registration-resend", challengeId: challenge.challengeId });
  assert.equal((await resent.json()).challenge.challengeId, "renewed-registration"); assert.equal(resent.headers.getSetCookie().length, 0);
  assert.deepEqual(calls.at(-1), { path: "/api/auth/registration/resend", input: { challengeId: challenge.challengeId } });

  smsEnabled = true;
  assert.deepEqual((await (await fetch(origin + "/shop-api/registration/methods")).json()).methods, ["email", "sms"]);
  const sms = await post({ ...registration, verificationMethod: "sms" });
  assert.equal((await sms.json()).challenge.method, "sms"); assert.equal(sms.headers.getSetCookie().length, 0);

  const confirmed = await post({ action: "registration-verify", challengeId: "renewed-registration", code: "123456" });
  assert.equal(confirmed.status, 200);
  const data = await confirmed.json(); assert.equal(data.user.id, "customer"); assert.ok(!JSON.stringify(data).includes("private-registration"));
  for (const name of ["treba_access", "treba_refresh"]) {
    const cookie = confirmed.headers.getSetCookie().find(value => value.startsWith(name + "="));
    assert.ok(cookie); assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=lax/i);
  }
  const before = calls.length;
  assert.equal((await post({ ...registration, verificationMethod: "email" }, "https://untrusted.example")).status, 403);
  assert.equal(calls.length, before);
});
