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
const { readCatalogQuery, catalogHref } = await import(await moduleUrl(new URL("../src/lib/catalogQuery.ts", import.meta.url)));
const { searchCatalog } = await import(await moduleUrl(new URL("../src/lib/api/search.ts", import.meta.url)));
const { notificationHref } = await import(await moduleUrl(new URL("../src/lib/notifications.ts", import.meta.url)));
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

test("catalog search keeps filter values and pagination in the URL and backend request", async t => {
  const attribute = "11111111-1111-1111-1111-111111111111";
  const query = readCatalogQuery({ q: "  fixture  ", page: "2", minPrice: "0", maxPrice: "100.50", sort: "priceasc", stock: "available", ["attribute_" + attribute]: "16" });
  const requests = [];
  t.mock.method(globalThis, "fetch", async value => {
    const url = new URL(value); if (url.pathname === "/api/v1/categories") return Response.json(tree);
    requests.push(url); return Response.json({ content: [product], page: 2, totalElements: 30, totalPages: 2 });
  });
  const page = await searchCatalog(query, leaf.id);
  assert.equal(page.totalElements, 30); assert.equal(page.content[0].variantId, product.productVariantId);
  assert.equal(requests[0].searchParams.get("search"), "fixture");
  assert.equal(requests[0].searchParams.get("page"), "2"); assert.equal(requests[0].searchParams.get("size"), "24");
  assert.equal(requests[0].searchParams.get("categoryId"), leaf.id);
  assert.equal(requests[0].searchParams.get(`attributes[${attribute}]`), "16");
  const href = new URL(catalogHref("/search", query, 3), "https://treba.invalid");
  assert.equal(href.searchParams.get("page"), "3"); assert.equal(href.searchParams.get("attribute_" + attribute), "16");
  assert.equal(href.searchParams.get("minPrice"), "0");
  for (const bad of [{ minPrice: "-1" }, { minPrice: "NaN" }, { minPrice: "100", maxPrice: "1" }]) assert.throws(() => readCatalogQuery(bad));
  assert.equal(readCatalogQuery({ page: "bad", sort: "unsafe" }).page, 1);
});

test("notification links keep the exact admin destination and reject external paths", () => {
  const target = notificationHref({ scope: "admin", path: "/orders/fixture" });
  assert.equal(new URL(target).pathname, "/site-login/start"); assert.equal(new URL(target).searchParams.get("returnUrl"), "/orders/fixture");
  assert.equal(notificationHref({ scope: "shop", path: "/account/messages?ticket=fixture" }), "/account/messages?ticket=fixture");
  for (const path of ["//outside.test", "/%2f%2foutside.test", "/\\outside.test", "https://outside.test", "/login?next=%2Flogin"]) assert.equal(notificationHref({ scope: "shop", path }), "/account/notifications");
});
