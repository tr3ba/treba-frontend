import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function moduleAt(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import("data:text/javascript;base64," + Buffer.from(output).toString("base64"));
}
const state = await moduleAt("../src/lib/api/account-security.ts");
test("provider selection follows Facebook-only and disabled configurations", () => {
  assert.equal(state.configuredProvider([{ name: "facebook" }]), "facebook");
  assert.equal(state.configuredProvider([{ name: "google" }, { name: "facebook" }]), "google");
  assert.equal(state.configuredProvider([]), "");
  assert.equal(state.configuredProvider([{ name: "unsupported" }]), "");
});
test("opaque resends retain SMS labels while rotating challenge identity and timing", () => {
  const original = { challengeId: "old", method: "sms", maskedDestination: "+380*****67", expiresAt: "before", resendAvailableAt: "before" };
  const renewed = { challengeId: "new", method: "", maskedDestination: "", expiresAt: "after", resendAvailableAt: "later" };
  assert.deepEqual(state.registrationAfterResend(original, renewed), { ...renewed, method: "sms", maskedDestination: original.maskedDestination });
});
test("private media URLs retain the complete access ticket", async () => {
  const { resolveMediaUrl } = await moduleAt("../src/lib/api/client.ts");
  const url = new URL(resolveMediaUrl("/uploads/products/11111111/photo.png?access=user.expiry.signature"));
  assert.equal(url.searchParams.get("access"), "user.expiry.signature");
});
