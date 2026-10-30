import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const compiled = ts.transpileModule(await readFile(new URL("../src/features/admin/moderation-review.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { moderationQuery, reviewIndex, reviewNeighbor, removeReviewedProduct, groupReviewAttributes, reviewAttributeValue } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

test("review mode and selected item cannot change the pending-only query or discard filters", () => {
  const query = moderationQuery(new URLSearchParams("view=all&item=last&status=ACTIVE&page=3&size=2&search=headphones&waitingHours=24&sellerId=seller&categoryId=category&brandId=brand"));
  assert.equal(query.get("status"), "PENDING_MODERATION");
  assert.equal(query.get("sort"), "waiting");
  assert.equal(query.get("page"), "3");
  for (const key of ["size", "search", "waitingHours", "sellerId", "categoryId", "brandId"]) assert.equal(query.get(key), new URLSearchParams("size=2&search=headphones&waitingHours=24&sellerId=seller&categoryId=category&brandId=brand").get(key));
  assert.equal(query.has("view"), false);
  assert.equal(query.has("item"), false);
  assert.equal(moderationQuery(new URLSearchParams("sort=nameasc")).get("sort"), "nameasc");
});

test("sequential review covers both page boundaries without skipping the final or first item", () => {
  const data = { content: [{ id: "a" }, { id: "b" }], page: 2, size: 2, totalElements: 5, totalPages: 3 };
  assert.equal(reviewIndex(data.content, "b"), 1);
  assert.equal(reviewIndex(data.content, "last"), 1);
  assert.equal(reviewIndex(data.content, "removed"), 0);
  assert.equal(reviewIndex([], "a"), -1);
  assert.deepEqual(reviewNeighbor(data, 0, -1), { page: 1, item: "last" });
  assert.deepEqual(reviewNeighbor(data, 0, 1), { page: 2, item: "b" });
  assert.deepEqual(reviewNeighbor(data, 1, 1), { page: 3, item: null });
  assert.equal(reviewNeighbor({ ...data, page: 1 }, 0, -1), null);
  assert.equal(reviewNeighbor({ ...data, page: 3 }, 1, 1), null);
});

test("a successful review removes only that product, repairs page totals and cannot decrement twice", () => {
  const data = { content: [{ id: "c" }], page: 2, size: 2, totalElements: 3, totalPages: 2 };
  const updated = removeReviewedProduct(data, "c");
  assert.deepEqual(updated, { ...data, content: [], totalElements: 2, totalPages: 1 });
  assert.equal(data.content.length, 1);
  assert.equal(removeReviewedProduct(updated, "c"), updated);
  assert.equal(removeReviewedProduct(null, "c"), null);
  assert.equal(removeReviewedProduct({ ...data, page: 1, totalElements: 1, totalPages: 1 }, "c").totalPages, 0);
});

test("full product attributes retain zero, false, multiple options and independent variant scopes", () => {
  const values = [
    { attributeId: "color", optionId: "black", variantId: null },
    { attributeId: "color", optionId: "white" },
    { attributeId: "color", stringValue: "Red", variantId: "variant" },
    { attributeId: "hours", numberValue: 0 },
    { attributeId: "wireless", boolValue: false },
  ];
  const groups = groupReviewAttributes(values);
  assert.equal(groups.length, 4);
  assert.equal(groups[0].values.length, 2);
  assert.equal(groups[1].variantId, "variant");
  assert.equal(reviewAttributeValue(values[3]), 0);
  assert.equal(reviewAttributeValue(values[4]), false);
  assert.equal(reviewAttributeValue(values[0], { options: [{ id: "black", name: "Black" }] }), "Black");
  assert.equal(reviewAttributeValue(values[0], { options: [] }), "black");
});
