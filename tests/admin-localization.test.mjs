import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import ts from "typescript";

const messages = JSON.parse(
  await readFile(
    new URL("../src/features/admin/i18n/en.json", import.meta.url),
    "utf8",
  ),
);
const coreSource = await readFile(
  new URL("../src/features/admin/i18n/core.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(
  coreSource.replace(
    'import english from "./en.json";',
    `const english = ${JSON.stringify(messages)};`,
  ),
  { compilerOptions: { module: ts.ModuleKind.ESNext } },
).outputText;
const core = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);

test("English translations are complete and preserve every interpolation", () => {
  assert.ok(Object.keys(messages).length > 500);
  for (const [key, value] of Object.entries(messages)) {
    assert.ok(value.trim(), key);
    assert.doesNotMatch(value, /[\u0400-\u04ff]/, key);
    assert.deepEqual(
      (key.match(/\{\d+\}/g) ?? []).sort(),
      (value.match(/\{\d+\}/g) ?? []).sort(),
      key,
    );
  }
  for (const key of Object.values(core.statusMessages))
    assert.ok(Object.hasOwn(messages, key), key);
});

test("dates, currency, status labels and request failures follow the chosen language", () => {
  assert.equal(core.translate("en", "Замовлення ") + "TRB-42", "Order TRB-42");
  assert.equal(
    core.translate("en", "Вітаємо, {0}", ["Olena"]),
    "Welcome, Olena",
  );
  assert.equal(
    core.translate("uk", "Вітаємо, {0}", ["Олена"]),
    "Вітаємо, Олена",
  );
  assert.equal(
    core.translateStatus("en", "PENDING_MODERATION"),
    "Pending Moderation",
  );
  assert.equal(
    core.translateStatus("uk", "PENDING_MODERATION"),
    "На модерації",
  );
  assert.match(core.formatDate("en", "2026-10-30T10:00:00Z"), /Oct/);
  assert.match(core.formatDate("uk", "2026-10-30T10:00:00Z"), /жовт/);
  assert.equal(core.formatDate("en", "invalid"), "—");
  assert.match(core.formatMoney("en", 1234.5), /1,234\.50/);
  assert.equal(
    core.translateError("en", "Сеанс завершився. Увійдіть знову."),
    "Your session has expired. Sign in again.",
  );
  assert.equal(
    core.translateError("en", "Невідома помилка сервера"),
    "The request could not be completed.",
  );
  assert.equal(
    core.translate("en", "User-written content"),
    "User-written content",
  );
  assert.equal(core.normalizeLanguage("en-GB"), "en");
  assert.equal(core.normalizeLanguage("uk-UA"), "uk");
});

test("workspace components route Ukrainian interface copy through the dictionary", async () => {
  for (const directory of ["components/admin/", "features/admin/", "components/auth/"]) {
    const root = new URL("../src/" + directory, import.meta.url);
    for (const name of (await readdir(root)).filter((name) =>
      name.endsWith(".tsx"),
    )) {
      const source = ts.createSourceFile(
        name,
        await readFile(new URL(name, root), "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      function visit(node) {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          ["t", "message"].includes(node.expression.text) &&
          node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0])
        ) {
          assert.ok(
            Object.hasOwn(messages, node.arguments[0].text),
            `${name}: missing ${node.arguments[0].text}`,
          );
        }
        if (
          (ts.isJsxText(node) ||
            ts.isStringLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node)) &&
          /[\u0400-\u04ff]/.test(node.text) &&
          node.text.trim() !== "Українська"
        ) {
          const parent = node.parent;
          assert.ok(
            ts.isCallExpression(parent) &&
              ts.isIdentifier(parent.expression) &&
              ["t", "message"].includes(parent.expression.text),
            `${name}: untranslated ${node.text.trim()}`,
          );
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
});
