import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

async function* sources(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) yield* sources(path);
    else if (/\.(tsx|css)$/.test(entry.name)) yield path;
  }
}

test("workspace elements do not match generic cosmetic ad filters", async () => {
  const filters = await readFile(
    new URL("./fixtures/admin-cosmetic-filters.css", import.meta.url), "utf8",
  );
  const blockedClasses = [...filters.matchAll(/^\.([\w-]+)/gm)].map(match => match[1]);
  assert.ok(blockedClasses.length > 0);
  for (const directory of ["app/admin/", "components/admin/", "features/admin/"]) {
    for await (const path of sources(new URL("../src/" + directory, import.meta.url))) {
      const source = await readFile(path, "utf8");
      for (const blocked of blockedClasses) {
        assert.doesNotMatch(source, new RegExp(`(?<![\\w-])${blocked}(?![\\w-])`),
          `${path.pathname} reuses the generic advertising class ${blocked}`);
      }
    }
  }
});
