import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

test("Google and Facebook authorization creates protected website sessions and retains 2FA", { timeout: 120000 }, async t => {
  const reserve = http.createServer(); reserve.listen(0, "127.0.0.1"); await once(reserve, "listening");
  const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const exchanges = []; let facebookEnabled = true;
  const authentication = { userId: "social-customer", firstName: "Олена", lastName: "Коваль", email: "customer@example.test", role: "Customer",
    accessToken: "private-website-access", refreshToken: "private-website-refresh", expiresAt: new Date(Date.now() + 600000).toISOString() };
  const challenge = { challengeId: "social-challenge", methods: ["email", "authenticator", "telegram"], maskedEmail: "c***@example.test", expiresAt: new Date(Date.now() + 300000).toISOString() };
  const backend = http.createServer(async (request, response) => {
    let body = ""; for await (const chunk of request) body += chunk;
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth/external/providers") {
      response.end(JSON.stringify(["google", ...(facebookEnabled ? ["facebook"] : [])].map(name => ({ name, clientId: name + "-client",
        authorizationUrl: name === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://www.facebook.com/dialog/oauth",
        scopes: name === "google" ? ["openid", "email", "profile"] : ["email", "public_profile"], redirectUri: origin + "/api/auth/external/" + name + "/callback" })))); return;
    }
    if (request.url === "/api/auth/external/code") {
      const input = JSON.parse(body); exchanges.push(input);
      if (input.code === "invalid") { response.writeHead(401); response.end(JSON.stringify({ message: "Код входу недійсний." })); return; }
      response.end(JSON.stringify(input.code === "challenge" ? { challenge } : { authentication: input.code === "staff" ? { ...authentication, role: "Manager" } : authentication })); return;
    }
    if (request.url === "/api/auth/2fa/verify") {
      const input = JSON.parse(body); assert.equal(input.challengeId, challenge.challengeId); assert.equal(input.code, "123456");
      response.end(JSON.stringify(authentication)); return;
    }
    if (request.url === "/api/users/me") { assert.equal(request.headers.authorization, "Bearer private-website-access"); response.end(JSON.stringify(authentication)); return; }
    response.writeHead(404); response.end("{}");
  });
  backend.listen(0, "127.0.0.1"); await once(backend, "listening");
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { windowsHide: true, env: { ...process.env, NODE_ENV: "production", TREBA_STORE_ORIGIN: origin, TREBA_API_URL: `http://127.0.0.1:${backend.address().port}` }, stdio: ["ignore", "pipe", "pipe"] });
  let output = ""; child.stdout.on("data", value => output += value); child.stderr.on("data", value => output += value);
  t.after(async () => { child.kill("SIGTERM"); backend.closeAllConnections(); await new Promise(resolve => backend.close(resolve)); });
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) { try { if ((await fetch(origin + "/shop-api/session")).status === 401) { ready = true; break; } } catch {} await delay(500); }
  assert.ok(ready, output);
  const jar = response => response.headers.getSetCookie().filter(cookie => !/Max-Age=0/i.test(cookie)).map(cookie => cookie.split(";")[0]).join("; ");
  const request = (path, cookie) => fetch(origin + path, { redirect: "manual", headers: cookie ? { Cookie: cookie } : {} });
  const start = async (provider, next = "/checkout", remember = false) => {
    const response = await request(`/shop-api/external/${provider}/start?${new URLSearchParams({ next, remember: remember ? "1" : "0" })}`);
    assert.equal(response.status, 303);
    return { response, location: new URL(response.headers.get("location")), cookie: jar(response) };
  };
  const callback = (provider, flow, code, state = flow.location.searchParams.get("state")) => request(`/shop-api/external/${provider}/callback?${new URLSearchParams({ code, state })}`, flow.cookie);

  for (const provider of ["google", "facebook"]) await t.test(`${provider} sends a code request and creates an HttpOnly session`, async () => {
    const flow = await start(provider);
    assert.equal(flow.location.searchParams.get("response_type"), "code");
    assert.equal(flow.location.searchParams.get("redirect_uri"), `${origin}/api/auth/external/${provider}/callback`);
    assert.match(flow.location.searchParams.get("state"), /^[A-Za-z0-9_-]{43}$/);
    assert.ok(!flow.location.search.includes("secret")); assert.ok(!flow.location.search.includes("access_token"));
    const response = await callback(provider, flow, "new-customer");
    assert.equal(response.status, 303); assert.equal(response.headers.get("location"), origin + "/checkout");
    assert.equal(exchanges.at(-1).provider, provider); assert.equal(exchanges.at(-1).redirectUri, `${origin}/api/auth/external/${provider}/callback`);
    if (provider === "google") {
      assert.equal(flow.location.searchParams.get("code_challenge_method"), "S256");
      assert.equal(flow.location.searchParams.get("code_challenge"), createHash("sha256").update(exchanges.at(-1).codeVerifier).digest("base64url"));
    }
    const cookies = response.headers.getSetCookie().filter(cookie => cookie.startsWith("treba_access=") || cookie.startsWith("treba_refresh="));
    assert.equal(cookies.length, 2);
    for (const cookie of cookies) { assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Secure/i); assert.ok(!/Max-Age=/i.test(cookie)); }
    assert.match(response.headers.get("referrer-policy"), /no-referrer/);
    assert.ok(!response.headers.get("location").includes("private-website"));
    const session = await fetch(origin + "/shop-api/session", { headers: { Cookie: jar(response) } });
    assert.equal(session.status, 200); const text = await session.text(); assert.ok(text.includes("social-customer")); assert.ok(!text.includes("private-website"));
  });

  await t.test("a staff OAuth login creates only a short-lived admin handoff", async () => {
    const response = await callback("google", await start("google"), "staff");
    assert.equal(response.status, 303); assert.equal(response.headers.get("location"), "https://admin.treba.duckdns.org/site-login/start");
    assert.ok(response.headers.getSetCookie().some(value => value.startsWith("treba_staff_handoff=private-website-access;") && /Path=\/shop-api\/admin-entry/i.test(value)));
    assert.ok(!response.headers.getSetCookie().some(value => value.startsWith("treba_access=private-website-access;")));
  });

  await t.test("direct login, register and OAuth-return pages contain the storefront behind their dialog", async () => {
    for (const path of ["/login", "/register", "/login?external=1"]) {
      const response = await fetch(origin + path); assert.equal(response.status, 200);
      const html = await response.text(); assert.match(html, /<header[ >]/); assert.match(html, /role="dialog"/); assert.match(html, /aria-hidden="true" inert/);
    }
  });

  await t.test("wrong state, missing cookie and wrong provider never exchange an authorization code", async () => {
    const flow = await start("google"); const before = exchanges.length;
    for (const response of [await callback("google", flow, "login", "x".repeat(43)), await request("/shop-api/external/google/callback?code=login&state=" + flow.location.searchParams.get("state")), await callback("facebook", flow, "login")]) {
      assert.equal(new URL(response.headers.get("location")).pathname, "/login");
      assert.ok(!response.headers.getSetCookie().some(cookie => cookie.startsWith("treba_access=")));
    }
    assert.equal(exchanges.length, before);
  });

  await t.test("provider cancellation returns an understandable error without a session", async () => {
    const flow = await start("facebook"); const before = exchanges.length;
    const response = await request(`/shop-api/external/facebook/callback?error=access_denied&state=${flow.location.searchParams.get("state")}`, flow.cookie);
    const pending = await request("/shop-api/external/pending", jar(response));
    assert.match((await pending.json()).message, /скасовано/); assert.equal(exchanges.length, before);
  });

  await t.test("2FA returns a challenge and sets session cookies only after verification", async () => {
    const flow = await start("google"); const response = await callback("google", flow, "challenge");
    assert.ok(!response.headers.getSetCookie().some(cookie => cookie.startsWith("treba_access=")));
    const pending = await request("/shop-api/external/pending", jar(response));
    assert.deepEqual(await pending.json(), { challenge, remember: false });
    const verified = await fetch(origin + "/shop-api/session", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", Cookie: jar(response) }, body: JSON.stringify({ action: "verify", challengeId: challenge.challengeId, method: "email", code: "123456", remember: false }) });
    assert.equal(verified.status, 200); assert.ok(verified.headers.getSetCookie().some(cookie => cookie.startsWith("treba_access=")));
    assert.ok(verified.headers.getSetCookie().some(cookie => cookie.includes("treba_external_result=") && /Max-Age=0/i.test(cookie)));
  });

  await t.test("untrusted return addresses are discarded and failed codes do not authenticate", async () => {
    const flow = await start("google", "https://untrusted.example/");
    const response = await callback("google", flow, "normal"); assert.equal(response.headers.get("location"), origin + "/");
    const failed = await callback("google", await start("google"), "invalid");
    assert.ok(!failed.headers.getSetCookie().some(cookie => cookie.startsWith("treba_access=")));
    assert.equal((await (await request("/shop-api/external/pending", jar(failed))).json()).message, "Код входу недійсний.");
  });

  await t.test("unconfigured and unsupported providers do not start authorization", async () => {
    facebookEnabled = false;
    const response = await request("/shop-api/external/facebook/start");
    assert.equal(new URL(response.headers.get("location")).pathname, "/login");
    assert.match((await (await request("/shop-api/external/pending", jar(response))).json()).message, /недоступний/);
    assert.equal((await request("/shop-api/external/unknown/start")).status, 404);
  });
});
