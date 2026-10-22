import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Execute the API modules without Next's bundler, as in auth-redirect.test.mjs.
const require = createRequire(import.meta.url);
const modules = new Map();
async function moduleUrl(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  let code = ts.transpileModule(await readFile(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const match of [...code.matchAll(/from "([^"]+)"/g)]) {
    const specifier = match[1];
    const resolved = specifier.startsWith(".")
      ? await moduleUrl(new URL(specifier + ".ts", url))
      : pathToFileURL(require.resolve(specifier)).href;
    code = code.replace(match[0], `from "${resolved}"`);
  }
  const result = "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  modules.set(url.href, result);
  return result;
}

const categories = await import(await moduleUrl(new URL("../src/lib/api/categories.ts", import.meta.url)));
const products = await import(await moduleUrl(new URL("../src/lib/api/products.ts", import.meta.url)));
const node = (id, slug, parentId, children = [], extra = {}) => ({
  id, slug, name: slug, parentId, children, isActive: true, sortOrder: 0,
  imageUrl: "https://content.rozetka.com.ua/categories/fixture.jpg", ...extra,
});
const leaf = node("leaf-guid", "deep-category", "group-guid");
const group = node("group-guid", "group", "root-guid", [leaf]);
const hidden = node("hidden-guid", "hidden", "root-guid", [node("hidden-leaf", "hidden-child", "hidden-guid")], { isActive: false });
const tree = [node("root-guid", "laptops", null, [group, hidden])];
const product = {
  id: "product-guid", slug: "fixture-product", productVariantId: "variant-guid",
  name: "Fixture product", categoryId: leaf.id, images: [], price: 100,
  oldPrice: null, stockQuantity: 1, storeId: "store-guid", storeName: "Store",
};

test("category navigation keeps API photos, deep links and ancestor breadcrumbs", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json(tree));
  const [root] = await categories.getCategories();
  assert.equal(root.icon, tree[0].imageUrl);
  assert.deepEqual(root.subcategories.map(item => item.id), ["group"]);
  assert.deepEqual(root.subcategories[0].itemLinks, [{ id: leaf.slug, label: leaf.name }]);
  const found = await categories.getCategoryById(leaf.slug);
  assert.equal(found.backendId, leaf.id);
  assert.deepEqual(found.path.map(item => item.id), ["laptops", "group"]);
  assert.equal((await categories.getCategoryById(leaf.id)).id, leaf.slug);
  assert.equal(await categories.getCategoryById("hidden-child"), null);
  assert.equal(await categories.getCategoryById("unknown-category"), null);
});

test("deep categories filter the backend by GUID and preserve checkout variants", async t => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async value => {
    const url = new URL(value);
    if (url.pathname === "/api/v1/categories") return Response.json(tree);
    requests.push(url);
    return Response.json({ content: [product] });
  });
  const [found] = await products.getProductsByCategory(leaf.slug, 12);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].pathname, "/api/v1/catalog");
  assert.equal(requests[0].searchParams.get("categoryId"), leaf.id);
  assert.equal(requests[0].searchParams.get("size"), "12");
  assert.equal(found.variantId, product.productVariantId);
  assert.equal(found.categoryId, "laptops");
  assert.deepEqual(await products.getProductsByCategory("unknown-category"), []);
  assert.equal(requests.length, 1);
});

test("product details use the slug endpoint introduced on main", async t => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async value => {
    const url = new URL(value);
    if (url.pathname === "/api/v1/categories") return Response.json(tree);
    requests.push(url.pathname);
    return Response.json(product);
  });
  const found = await products.getProductById(product.slug);
  assert.deepEqual(requests, ["/api/v1/catalog/fixture-product"]);
  assert.equal(found.variantId, product.productVariantId);
});
