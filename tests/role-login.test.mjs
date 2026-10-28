import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function compiled(name) {
  return ts.transpileModule(await readFile(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  }).outputText;
}
const dataUrl = source => "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const redirects = dataUrl(await compiled("redirect"));
const source = (await compiled("admin")).replace('from "./redirect"', `from "${redirects}"`);
const { getLoginDestination, canOpenAdmin, canApplyAsSeller, canUseCustomerAccount, workspaceLabel, adminOrigin } = await import(dataUrl(source));

test("every workspace role goes to its panel after login, including from a customer page", () => {
  for (const role of ["Administrator", "Manager", "Moderator", "Seller"]) {
    assert.equal(canOpenAdmin(role), true);
    assert.equal(getLoginDestination(role), adminOrigin + "/site-login/start");
    assert.equal(getLoginDestination(role, "/sell#apply"), adminOrigin + "/site-login/start");
    assert.equal(getLoginDestination(role, "/account"), adminOrigin + "/site-login/start");
    assert.equal(canApplyAsSeller(role), false);
    assert.equal(canUseCustomerAccount(role), false);
  }
  assert.equal(workspaceLabel("Seller"), "Кабінет продавця");
  assert.equal(workspaceLabel("Administrator"), "Адмін-панель");
});

test("customers keep modal login and their intended customer destination", () => {
  assert.equal(getLoginDestination("Customer"), null);
  assert.equal(getLoginDestination("Customer", "/account/messages?product=fixture"), "/account/messages?product=fixture");
  assert.equal(canApplyAsSeller("Customer"), true);
  assert.equal(canUseCustomerAccount("Customer"), true);
  for (const role of [undefined, "", "Unrecognized", "administrator"]) {
    assert.equal(canOpenAdmin(role), false);
    assert.equal(canApplyAsSeller(role), false);
    assert.equal(getLoginDestination(role), null);
  }
});

test("an existing admin handoff completes once and keeps its state", () => {
  const target = "/shop-api/admin-entry?state=" + "A".repeat(64);
  for (const role of ["Administrator", "Manager", "Moderator", "Seller"]) {
    assert.equal(getLoginDestination(role, target), target);
    for (const invalid of ["//outside.test", "https://outside.test", "/login?next=%2Flogin", "/shop-api/admin-entry?state=invalid", "/shop-api/admin-entry/other?state=" + "A".repeat(64)]) {
      assert.equal(getLoginDestination(role, invalid), adminOrigin + "/site-login/start");
    }
  }
  assert.equal(getLoginDestination("Customer", "//outside.test"), "/");
});

test("development can use its configured admin origin", async () => {
  const previous = process.env.NEXT_PUBLIC_ADMIN_URL;
  process.env.NEXT_PUBLIC_ADMIN_URL = "http://localhost:5434/";
  try {
    const local = await import(dataUrl(source + "\n// local admin configuration"));
    assert.equal(local.getLoginDestination("Administrator"), "http://localhost:5434/site-login/start");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_ADMIN_URL;
    else process.env.NEXT_PUBLIC_ADMIN_URL = previous;
  }
});
