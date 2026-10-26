import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

export async function startDeliveryFixture() {
  const city = "11111111-1111-1111-1111-111111111111", point = "22222222-2222-2222-2222-222222222222";
  const quoteId = "44444444-4444-4444-4444-444444444444", variantId = "55555555-5555-5555-5555-555555555555";
  let settings = { ordersEmail: false, ordersTelegram: false, supportEmail: false, supportTelegram: false, version: "fixture-v1", emailAvailable: true, telegramAvailable: false };
  let linked = false; const requests = [];
  const backend = http.createServer(async (req, res) => {
    let text = ""; for await (const chunk of req) text += chunk;
    const body = text ? JSON.parse(text) : undefined;
    const path = new URL(req.url, "http://fixture").pathname;
    requests.push({ path, method: req.method, body, authorization: req.headers.authorization });
    res.setHeader("Content-Type", "application/json");
    const send = (value, status = 200) => { res.writeHead(status); res.end(JSON.stringify(value)); };
    if (path === "/api/auth/login") return send({ authentication: { userId: "fixture-customer", firstName: "Тест", lastName: "Покупець", email: "fixture@example.test", role: "Customer", accessToken: "fixture-access", refreshToken: "fixture-refresh", expiresAt: new Date(Date.now() + 3600000).toISOString() } });
    if (path.startsWith("/api/v1/catalog") || path === "/api/categories/tree") return send(path.includes("categories") ? [] : { content: [], totalElements: 0 });
    if (req.headers.authorization !== "Bearer fixture-access") return send({}, 401);
    if (path === "/api/users/me") return send({ id: "fixture-customer", firstName: "Тест", lastName: "Покупець", email: "fixture@example.test", phone: "+380501234567", role: "Customer" });
    if (path === "/api/v1/account/shipments" || path === "/api/v1/account/orders/" + quoteId) {
      const order = { id: quoteId, orderNumber: "ORD-FIXTURE", status: "SHIPPED", paymentStatus: "SUCCEEDED", currency: "UAH", subtotal: 250, discountAmount: 0, deliveryPrice: 95.5, totalAmount: 345.5, createdAt: new Date().toISOString(), recipientName: "Тест Покупець", recipientPhone: "+380501234567", recipientEmail: "fixture@example.test", deliveryAddress: "Київ, поштомат №123", items: [], history: [{ status: "AWAITING_PAYMENT", createdAt: new Date().toISOString() }, { status: "SHIPPED", createdAt: new Date().toISOString() }], delivery: { carrier: "NovaPoshta", mode: "Managed", reference: "TRB-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", city: "Київ", pickupPoint: "Поштомат №123: вул. Тестова, 1", postomat: true, status: "SHIPPED", notice: "" } };
      return send(path.endsWith("shipments") ? { content: [order], page: 1, totalPages: 1, totalElements: 1 } : order);
    }
    if (path === "/api/v1/account/preferences") return send({ values: {}, version: "fixture-preferences" });
    if (path === "/api/v1/account/notifications") return send({ items: [], unreadCount: 0 });
    if (path === "/api/v1/account/notification-settings") {
      if (req.method === "PUT") { if (body.version !== settings.version) return send({ title: "Stale settings" }, 409); settings = { ...settings, ...body, version: "fixture-v2" }; }
      return send(settings);
    }
    if (path === "/api/telegram/link") {
      if (req.method === "POST") return send({ botUrl: "https://t.me/TrebaFixtureBot?start=fixture", expiresAt: new Date(Date.now() + 600000).toISOString() });
      if (req.method === "DELETE") linked = false;
      return send({ configured: true, linked, username: linked ? "fixture_customer" : null });
    }
    if (path === "/api/telegram/link/confirm") { linked = true; return send({ configured: true, linked }); }
    if (path === "/api/v1/delivery/capabilities") return send({ available: true, shipmentMode: "Managed" });
    if (path === "/api/v1/delivery/cities") return send([{ ref: city, name: "Київ", area: "Київська" }]);
    if (path === "/api/v1/delivery/pickup-points") return send({ items: [{ ref: point, cityRef: city, name: "Поштомат №123: вул. Тестова, 1", number: "123", postomat: true }], page: 1, hasMore: false });
    if (path === "/api/v1/delivery/quotes") return send({ id: quoteId, price: 95.5, currency: "UAH", city: "Київ", pickupPoint: "Поштомат №123: вул. Тестова, 1", weightKg: 1, estimatedWeight: true, expiresAt: new Date(Date.now() + 600000).toISOString(), shipmentMode: "Managed" });
    if (path === "/api/v1/cart") return send({ id: "fixture-cart", userId: "fixture-customer", totalQuantity: 1, totalPrice: 250, items: [{ id: "fixture-item", productId: variantId, productVariantId: variantId, productName: "Тестовий товар TREBA", variantName: "Основний", imageUrl: null, price: 250, oldPrice: null, quantity: 1, totalPrice: 250, isAvailable: true }] });
    if (path === "/api/v1/wishlist") return send({ items: [] });
    if (path === "/api/v1/orders") return send({ id: quoteId, orderNumber: "ORD-FIXTURE", status: "AWAITING_PAYMENT", subtotal: 250, discountAmount: 0, deliveryPrice: 95.5, totalAmount: 345.5 }, 201);
    return send({}, 404);
  });
  backend.listen(0, "127.0.0.1"); await once(backend, "listening");
  const reserve = http.createServer(); reserve.listen(0, "127.0.0.1"); await once(reserve, "listening");
  const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    windowsHide: true, env: { ...process.env, NODE_ENV: "production", TREBA_API_URL: `http://127.0.0.1:${backend.address().port}` }, stdio: ["ignore", "pipe", "pipe"] });
  let output = ""; for (const pipe of [child.stdout, child.stderr]) pipe.on("data", data => { output = (output + data).slice(-4000); });
  const close = async () => { child.kill("SIGTERM"); backend.closeAllConnections(); await new Promise(resolve => backend.close(resolve)); };
  for (let attempt = 0; attempt < 90; attempt++) {
    try { if ((await fetch(origin + "/shop-api/session")).status === 401) return { origin, close, requests, city, point, quoteId, variantId }; } catch {}
    await delay(300);
  }
  await close(); throw new Error(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fixture = await startDeliveryFixture(); console.log(JSON.stringify({ origin: fixture.origin }));
  process.on("SIGTERM", () => fixture.close().then(() => process.exit(0)));
  process.stdin.once("data", () => fixture.close().then(() => process.exit(0)));
}
