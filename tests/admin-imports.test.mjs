import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const compiled = ts.transpileModule(await readFile(new URL("../src/features/admin/import-attributes.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { importedAttributeValue } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const field = (type, options = [], unit) => ({ id: "one", name: "Value", type, options, unit, isRequired: true });
const value = (text) => [{ name: "Value:", value: text }];

test("import specifications preselect only matching options, including multiple values", () => {
  const options = [{ id: "blue", name: "Blue" }, { id: "white", name: "White" }];
  assert.equal(importedAttributeValue(field("SELECT", options), value("blue")), "blue");
  assert.deepEqual(importedAttributeValue(field("MULTI_SELECT", options), value("Blue; WHITE")), ["blue", "white"]);
  assert.equal(importedAttributeValue(field("SELECT", options), value("Blue; WHITE")), "");
  assert.equal(importedAttributeValue(field("SELECT", options), value("Dark blue")), "");
});

test("imported zero and false remain meaningful values; incompatible numbers and units require review", () => {
  assert.equal(importedAttributeValue(field("NUMBER", [], "kg"), value("0 kg")), "0");
  assert.equal(importedAttributeValue(field("NUMBER", [], "кг"), value("3,3 кг")), "3.3");
  assert.equal(importedAttributeValue(field("NUMBER", [], "kg"), value("3 g")), "");
  assert.equal(importedAttributeValue(field("BOOLEAN"), value("Ні")), "false");
  assert.equal(importedAttributeValue(field("BOOLEAN"), value("Yes")), "true");
  assert.equal(importedAttributeValue(field("BOOLEAN"), value("Possibly")), "");
});

test("unmapped source text remains available, and absent or ambiguous dates are never invented", () => {
  assert.equal(importedAttributeValue(field("TEXT"), value("Source specification")), "Source specification");
  assert.equal(importedAttributeValue(field("DATE"), value("2026-10-30")), "2026-10-30");
  assert.equal(importedAttributeValue(field("DATE"), value("10/11/26")), "");
  assert.equal(importedAttributeValue(field("TEXT"), []), "");
});
