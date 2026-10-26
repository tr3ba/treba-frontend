import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, parsePrice } from "../src/lib/format.ts";

test("carrier prices and order totals retain kopecks", () => {
  assert.equal(formatPrice(95.5), "95,50");
  assert.equal(formatPrice(345.5), "345,50");
  assert.equal(formatPrice(12345.67), "12 345,67");
  assert.equal(formatPrice(250), "250");
  assert.equal(parsePrice(formatPrice(95.5)), 95.5);
});
