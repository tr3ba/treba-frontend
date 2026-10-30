import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const compiled = ts.transpileModule(await readFile(new URL("../src/features/admin/avatar-crop.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { avatarCropRect, moveAvatarCrop, constrainAvatarCrop, initialAvatarCrop, avatarOutputSize } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("square avatars center landscape and portrait originals without distortion", () => {
  assert.equal(avatarOutputSize, 512);
  assert.deepEqual(avatarCropRect(1200, 800, initialAvatarCrop), { x: 200, y: 0, size: 800 });
  assert.deepEqual(avatarCropRect(800, 1200, initialAvatarCrop), { x: 0, y: 200, size: 800 });
  assert.deepEqual(avatarCropRect(800, 800, initialAvatarCrop), { x: 0, y: 0, size: 800 });
});

test("zoom retains the selected center and crop edges never leave the original", () => {
  const centered = { x: .6, y: .4, zoom: 2 };
  assert.deepEqual(constrainAvatarCrop(1200, 800, centered), centered);
  const rect = avatarCropRect(1200, 800, centered);
  assert.equal(rect.size, 400);
  close(rect.x + rect.size / 2, 720);
  close(rect.y + rect.size / 2, 320);
  for (const [width, height] of [[1200, 800], [800, 1200], [1, 1]]) {
    for (const zoom of [-10, 1, 2.5, 4, 100]) {
      for (const x of [-100, .5, 100]) for (const y of [-100, .5, 100]) {
        const { x: left, y: top, size } = avatarCropRect(width, height, { x, y, zoom });
        assert.ok(left >= -1e-8 && top >= -1e-8);
        assert.ok(left + size <= width + 1e-8 && top + size <= height + 1e-8);
        assert.ok(size >= Math.min(width, height) / 4);
      }
    }
  }
});

test("dragging follows the pointer, scales with the viewport and stops at image edges", () => {
  const crop = { ...initialAvatarCrop, zoom: 2 };
  const desktop = moveAvatarCrop(1200, 800, crop, 60, -30, 300);
  const mobile = moveAvatarCrop(1200, 800, crop, 40, -20, 200);
  assert.deepEqual(desktop, mobile);
  const before = avatarCropRect(1200, 800, crop), after = avatarCropRect(1200, 800, desktop);
  close((before.x - after.x) * 300 / before.size, 60);
  close((before.y - after.y) * 300 / before.size, -30);
  const edge = avatarCropRect(1200, 800, moveAvatarCrop(1200, 800, crop, 1e6, -1e6, 300));
  close(edge.x, 0);
  close(edge.y + edge.size, 800);
  assert.deepEqual(moveAvatarCrop(1200, 800, crop, 1, 1, 0), crop);
});

test("invalid dimensions are rejected and non-finite crop controls fall back safely", () => {
  for (const size of [0, -1, NaN, Infinity]) assert.throws(() => avatarCropRect(size, 800, initialAvatarCrop), RangeError);
  assert.deepEqual(constrainAvatarCrop(800, 800, { x: NaN, y: Infinity, zoom: NaN }), initialAvatarCrop);
});
