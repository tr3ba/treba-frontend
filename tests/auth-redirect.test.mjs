import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/redirect.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { getSafeNextPath, getAccountLoginHref, buildAuthHref } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

test("protected chat redirects once and keeps the product context after login", () => {
  const target = "/account/messages?product=fixture&title=Навушники#reply";
  const canonical = "/account/messages?product=fixture&title=" + encodeURIComponent("Навушники") + "#reply";
  const login = getAccountLoginHref(target);
  assert.equal(new URL(login, "https://treba.invalid").searchParams.get("next"), canonical);
  assert.equal(getAccountLoginHref(login), null);
  assert.equal(getAccountLoginHref("/register?next=%2Faccount"), null);
  assert.equal(getSafeNextPath(target), canonical);
  assert.equal(getAccountLoginHref("/seller/orders"), "/login?next=%2Fseller%2Forders");
});

test("recursive auth returns, external addresses and malformed paths are discarded", () => {
  for (const target of ["//outside.test", "/\\outside.test", "/%2f%2foutside.test", "/login?next=%2Flogin", "/register/", "/%6cogin", "/a/../login", "/LOGIN", "/shop-api/external/google/start", "/api/auth/external/facebook/callback", "/account\n", "/%00", "/%zz", "/" + "a".repeat(2048)]) {
    assert.equal(getSafeNextPath(target), "/", target);
    assert.equal(buildAuthHref("/login", target), "/login?next=%2F");
  }
  assert.equal(getSafeNextPath("/account?filter=login"), "/account?filter=login");
  assert.equal(getSafeNextPath(null), "/");
});
