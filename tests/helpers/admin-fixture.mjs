// Disposable local API for UI/transport tests. It never connects to the production database.
import http from "node:http";
import { pathToFileURL } from "node:url";
export const ids = {
  product: "11111111-1111-4111-8111-111111111111",
  category: "22222222-2222-4222-8222-222222222222",
  brand: "33333333-3333-4333-8333-333333333333",
  store: "44444444-4444-4444-8444-444444444444",
  order: "55555555-5555-4555-8555-555555555555",
  ticket: "66666666-6666-4666-8666-666666666666",
  seller: "77777777-7777-4777-8777-777777777777",
  user: "88888888-8888-4888-8888-888888888888",
  promotion: "99999999-9999-4999-8999-999999999999",
  message: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
};
const now = "2026-10-29T10:00:00Z";
export function createAdminFixture() {
  const calls = [],
    lookup = [{ id: ids.category, name: "Електроніка" }],
    brand = [{ id: ids.brand, name: "TREBA Select" }],
    stores = [{ id: ids.store, name: "Treba Store" }];
  let product = {
    id: ids.product,
    name: "Бездротові навушники Air Studio",
    slug: "air-studio",
    storeId: ids.store,
    storeName: "Treba Store",
    sellerName: "TREBA Partner",
    categoryId: ids.category,
    categoryName: "Електроніка",
    brandId: ids.brand,
    brandName: "TREBA Select",
    status: "PENDING_MODERATION",
    shortDescription: "Чистий звук і комфорт щодня",
    description:
      "Бездротові навушники з активним шумозаглушенням. До 30 годин автономної роботи.",
    sku: "AIR-001",
    price: 2499,
    stockQuantity: 24,
    warrantyMonths: 12,
    countryOfOrigin: "Україна",
    manufacturerPartNumber: "AIR-STUDIO",
    updatedAt: now,
    createdAt: now,
    images: [],
    variants: [],
    attributes: [],
  };
  let order = {
    summary: {
      id: ids.order,
      orderNumber: "TRB-2026-0142",
      customerId: ids.user,
      customerName: "Олена Коваль",
      status: "PAID",
      totalAmount: 2549,
      currency: "UAH",
      itemCount: 1,
      createdAt: now,
    },
    recipientPhone: "+380000000000",
    recipientEmail: "customer@example.test",
    customerComment: "Доставка після 18:00",
    subtotal: 2499,
    discountAmount: 0,
    deliveryPrice: 50,
    address: {
      id: ids.user,
      country: "Україна",
      city: "Львів",
      street: "Тестова",
      building: "10",
      recipientName: "Олена Коваль",
      recipientPhone: "+380000000000",
    },
    items: [
      {
        id: ids.product,
        productName: product.name,
        variantName: "Чорний",
        sku: "AIR-001",
        quantity: 1,
        unitPrice: 2499,
        totalPrice: 2499,
      },
    ],
    history: [
      {
        previousStatus: "AWAITING_PAYMENT",
        newStatus: "PAID",
        comment: "Оплату підтверджено",
        createdAt: now,
      },
    ],
    version: "v1",
    allowedStatuses: ["CONFIRMED", "CANCELLED"],
    partialOrder: false,
  };
  let ticket = {
    summary: {
      id: ids.ticket,
      orderId: ids.order,
      orderNumber: order.summary.orderNumber,
      customerId: ids.user,
      customerName: "Олена Коваль",
      kind: "QUESTION",
      subject: "Уточнення щодо доставки",
      status: "OPEN",
      updatedAt: now,
      version: ids.ticket,
      unreadCount: 1,
      lastMessage: "Підкажіть, будь ласка, коли очікувати замовлення?",
    },
    messages: [
      {
        id: ids.message,
        authorName: "Олена Коваль",
        authorRole: "Customer",
        message: "Підкажіть, будь ласка, коли очікувати замовлення?",
        internal: false,
        createdAt: now,
      },
    ],
    allowedStatuses: ["IN_PROGRESS", "CLOSED"],
    hasEarlierMessages: false,
  };
  const seller = {
    id: ids.seller,
    userId: ids.user,
    companyName: "TREBA Partner",
    taxNumber: "00000000",
    description: "Партнер маркетплейсу TREBA",
    phone: "+380000000000",
    email: "seller@example.test",
    status: 1,
    createdAt: now,
  };
  let promotion = {
    id: ids.promotion,
    name: "Осінні пропозиції",
    description: "Знижки на вибрані товари",
    type: "PERCENTAGE",
    status: "ACTIVE",
    startAt: now,
    endAt: "2026-11-29T10:00:00Z",
    discountValue: 10,
    maximumDiscount: 500,
    minimumOrderAmount: 1000,
    productId: null,
    categoryId: null,
    brandId: null,
    sellerId: null,
    version: ids.promotion,
    coupons: [
      {
        id: ids.promotion,
        code: "AUTUMN10",
        usageLimit: 100,
        usageLimitPerUser: 1,
        usedCount: 12,
        active: true,
      },
    ],
  };
  const customer = {
    id: ids.user,
    name: "Олена Коваль",
    email: "customer@example.test",
    orders: 3,
    orderedAmount: 12480,
    reviews: 2,
    lastOrderAt: now,
  };
  const review = {
    id: ids.product,
    productName: product.name,
    productSlug: product.slug,
    authorName: customer.name,
    authorEmail: customer.email,
    rating: 5,
    title: "Зручні навушники",
    comment: "Гарний звук, швидка доставка. Дякую!",
    status: "PENDING",
    verifiedPurchase: true,
    createdAt: now,
  };
  const application = {
    id: ids.seller,
    companyName: "Новий партнер",
    storeName: "Studio Market",
    taxNumber: "00000000",
    contactName: "Андрій Тестовий",
    position: "Власник",
    email: "partner@example.test",
    phone: "+380000000001",
    status: "pending",
    createdAt: now,
    version: ids.seller,
  };
  const category = {
    id: ids.category,
    name: "Електроніка",
    slug: "electronics",
    isActive: true,
    sortOrder: 0,
    children: [
      {
        id: ids.brand,
        name: "Аудіо",
        slug: "audio",
        isActive: true,
        sortOrder: 0,
        children: [],
      },
    ],
  };
  const profile = (role) => ({
    id: ids.user,
    firstName: "Тест",
    lastName: "Адміністратор",
    email: "admin@example.test",
    phone: "+380000000000",
    role,
    status: "ACTIVE",
    createdAt: now,
    addresses: [],
    profile: { language: "uk", marketingEmailsEnabled: false },
  });
  const auth = (role, expired = false) => ({
    userId: ids.user,
    ...profile(role),
    accessToken: `fixture-${role}`,
    refreshToken: `refresh-${role}`,
    expiresAt: new Date(Date.now() + (expired ? -1000 : 3600000)).toISOString(),
  });
  const paged = (content) => ({
    content,
    page: 1,
    size: 20,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
  });
  const server = http.createServer(async (req, res) => {
    let raw = Buffer.alloc(0);
    for await (const chunk of req) raw = Buffer.concat([raw, chunk]);
    let body = {};
    if (
      req.headers["content-type"]?.includes("application/json") &&
      raw.length
    ) {
      try {
        body = JSON.parse(raw);
      } catch {
        res.writeHead(400);
        res.end("{}");
        return;
      }
    }
    const url = new URL(req.url, "http://fixture"),
      path = url.pathname,
      method = req.method;
    calls.push({
      path,
      method,
      body,
      contentType: req.headers["content-type"],
      bytes: raw.length,
      authorization: req.headers.authorization,
    });
    const reply = (data, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(status === 204 ? undefined : JSON.stringify(data));
    };
    if (path === "/api/auth/login") {
      const role =
        ["Administrator", "Manager", "Moderator", "Seller", "Customer"].find(
          (r) => body.email?.toLowerCase().startsWith(r.toLowerCase()),
        ) ?? "Administrator";
      reply({ authentication: auth(role, body.password === "expired") });
      return;
    }
    if (path === "/api/auth/refresh") {
      reply(auth(String(body.refreshToken).replace("refresh-", "")));
      return;
    }
    if (path === "/api/v1/categories" && method === "GET") {
      reply([category]);
      return;
    }
    if (path.startsWith("/api/v1/catalog")) {
      reply(
        path.includes("facets") ? { brands: [], attributes: [] } : paged([]),
      );
      return;
    }
    const role = req.headers.authorization?.replace("Bearer fixture-", "");
    if (!role) {
      reply({}, 401);
      return;
    }
    if (path === "/api/users/me") {
      reply(profile(role));
      return;
    }
    if (path === "/api/auth/logout") {
      reply(null, 204);
      return;
    }
    if (role === "Customer" && path.includes("/admin/")) {
      reply({}, 403);
      return;
    }
    if (
      /\/admin\/(users|settings|telegram)/.test(path) &&
      role !== "Administrator"
    ) {
      reply({}, 403);
      return;
    }
    if (path === "/api/users/me/avatar") {
      reply(profile(role));
      return;
    }
    if (path === "/api/v1/admin/dashboard") {
      reply({
        days: 30,
        pendingSellers: 3,
        activeSellers: 24,
        suspendedSellers: 1,
        pendingReviews: 8,
        publishedReviews: 180,
        rejectedReviews: 2,
        totalUsers: 1280,
        newUsers: 43,
        recentActivity: [
          {
            kind: "product",
            entityId: ids.product,
            name: product.name,
            status: product.status,
            occurredAt: now,
          },
          {
            kind: "seller",
            entityId: ids.seller,
            name: seller.companyName,
            status: "ACTIVE",
            occurredAt: now,
          },
        ],
      });
      return;
    }
    if (path === "/api/v1/admin/operations/metrics") {
      reply({
        days: 30,
        newOrders: 142,
        cancelledOrders: 4,
        orderedAmount: 284750,
        openTickets: 12,
        overdueTickets: 2,
        outOfStockProducts: 7,
        overdueModeration: 3,
      });
      return;
    }
    if (path === "/api/v1/admin/catalog/stats") {
      reply({
        total: 248,
        active: 210,
        pending: 18,
        drafts: 15,
        rejected: 5,
        outOfStock: 7,
      });
      return;
    }
    if (path === "/api/v1/admin/catalog/filter-options") {
      reply({
        categories: lookup,
        brands: brand,
        sellers: [{ id: ids.seller, name: seller.companyName }],
      });
      return;
    }
    if (/\/catalog\/(categories|brands|stores)$/.test(path)) {
      reply(
        path.endsWith("categories")
          ? lookup
          : path.endsWith("brands")
            ? brand
            : stores,
      );
      return;
    }
    if (path === "/api/v1/admin/catalog/attributes") {
      reply([
        {
          id: ids.brand,
          name: "Колір",
          type: "STRING",
          isRequired: false,
          options: [],
        },
      ]);
      return;
    }
    if (path.endsWith("/moderation-history")) {
      reply([
        {
          id: ids.product,
          occurredAt: now,
          actorName: "Менеджер TREBA",
          decision: "REJECTED",
          reason: "Уточніть характеристики товару.",
        },
      ]);
      return;
    }
    if (path.endsWith("/resubmission-changes")) {
      reply({
        capturedAt: now,
        changes: [
          { field: "Назва", before: "Air Studio", after: product.name },
        ],
      });
      return;
    }
    if (path === "/api/v1/admin/catalog/products" && method === "GET") {
      reply(paged([product]));
      return;
    }
    if (
      path === "/api/v1/admin/catalog/products" ||
      path === "/api/v1/admin/catalog/products/" + ids.product
    ) {
      if (method === "PUT" && body.expectedUpdatedAt !== product.updatedAt) {
        reply({ title: "Conflict" }, 409);
        return;
      }
      if (method !== "GET")
        product = { ...product, ...body, updatedAt: new Date().toISOString() };
      reply(product);
      return;
    }
    if (/\/products\/.+\/(approve|reject|submit)$/.test(path)) {
      product.status = path.endsWith("approve")
        ? "ACTIVE"
        : path.endsWith("reject")
          ? "REJECTED"
          : "PENDING_MODERATION";
      reply(null, 204);
      return;
    }
    if (path.endsWith("/images/upload")) {
      product.images.push({
        id: ids.message,
        imageUrl: "/test-product.svg",
        isMain: true,
        sortOrder: 0,
      });
      reply(product.images.at(-1));
      return;
    }
    if (path === "/api/v1/admin/catalog/bulk/preview") {
      reply({
        token: "preview-token",
        expiresAt: now,
        rows: [
          {
            productId: ids.product,
            variantId: ids.product,
            name: product.name,
            sku: product.sku,
            beforePrice: product.price,
            afterPrice: body.price ?? product.price,
            beforeStock: product.stockQuantity,
            afterStock: body.stockQuantity ?? product.stockQuantity,
          },
        ],
      });
      return;
    }
    if (path.endsWith("/bulk/apply")) {
      reply(null, 204);
      return;
    }
    if (path === "/api/v1/admin/orders") {
      reply(paged([order.summary]));
      return;
    }
    if (path === "/api/v1/admin/orders/" + ids.order) {
      reply(order);
      return;
    }
    if (path.endsWith("/status") && path.includes("/orders/")) {
      if (body.expectedVersion !== order.version) {
        reply({ title: "Conflict" }, 409);
        return;
      }
      order.summary.status = body.status;
      order.version = "v2";
      order.history.push({
        previousStatus: "PAID",
        newStatus: body.status,
        comment: body.reason,
        createdAt: now,
      });
      reply(null, 204);
      return;
    }
    if (path === "/api/v1/support/capabilities") {
      reply({
        canDelete: role === "Administrator" || role === "Manager",
        canRestore: role === "Administrator" || role === "Manager",
      });
      return;
    }
    if (path === "/api/v1/support" || path === "/api/v1/support/deleted") {
      reply(method === "GET" ? paged([ticket.summary]) : ticket);
      return;
    }
    if (path === "/api/v1/support/" + ids.ticket) {
      reply(method === "GET" ? ticket : null, method === "GET" ? 200 : 204);
      return;
    }
    if (path.endsWith("/messages")) {
      if (method === "POST") {
        ticket.messages.push({
          id: body.clientMessageId,
          authorName: "Тест Адміністратор",
          authorRole: role,
          message: body.message,
          internal: body.internal,
          createdAt: now,
        });
        reply(null, 204);
      } else reply({ messages: [], hasMore: false });
      return;
    }
    if (path.endsWith("/status") && path.includes("/support/")) {
      ticket.summary.status = body.status;
      reply(null, 204);
      return;
    }
    if (/\/support\/.+\/(read|restore)$/.test(path)) {
      reply(null, 204);
      return;
    }
    if (path === "/api/v1/admin/sellers") {
      reply(method === "GET" ? [seller] : { sellerId: ids.seller });
      return;
    }
    if (path === "/api/v1/admin/sellers/" + ids.seller) {
      reply(seller);
      return;
    }
    if (/\/sellers\/.+\/(approve|suspend)$/.test(path)) {
      seller.status = path.endsWith("approve") ? 1 : 2;
      reply(seller);
      return;
    }
    if (path === "/api/v1/admin/seller-applications") {
      reply(paged([application]));
      return;
    }
    if (path.endsWith("/review")) {
      application.status = body.approve ? "approved" : "rejected";
      reply(application);
      return;
    }
    if (path === "/api/v1/admin/reviews") {
      reply(paged([review]));
      return;
    }
    if (path.endsWith("/moderate")) {
      review.status = body.status;
      reply(null, 204);
      return;
    }
    if (path === "/api/v1/admin/users") {
      reply(
        method === "GET" ? paged([profile("Customer")]) : profile("Customer"),
      );
      return;
    }
    if (path === "/api/v1/admin/users/" + ids.user) {
      reply(profile("Customer"));
      return;
    }
    if (/\/(block|unblock)$/.test(path)) {
      reply({
        id: ids.user,
        status: path.endsWith("unblock") ? "ACTIVE" : "BLOCKED",
      });
      return;
    }
    if (path === "/api/v1/admin/operations/customers") {
      reply(paged([customer]));
      return;
    }
    if (path === "/api/v1/admin/operations/customers/" + ids.user) {
      reply({
        customer,
        orders: [order.summary],
        reviews: [review],
        tickets: [ticket.summary],
      });
      return;
    }
    if (
      path === "/api/v1/admin/promotions" ||
      path === "/api/v1/admin/promotions/" + ids.promotion
    ) {
      if (method !== "GET") promotion = { ...promotion, ...body };
      reply(
        path.endsWith("/promotions") && method === "GET"
          ? paged([promotion])
          : promotion,
      );
      return;
    }
    if (path === "/api/v1/admin/settings/staff") {
      reply(
        method === "GET"
          ? paged([
              profile("Manager"),
              {
                ...profile("Moderator"),
                id: ids.seller,
                firstName: "Ірина",
                lastName: "Модератор",
              },
            ])
          : profile(body.role),
        method === "POST" ? 201 : 200,
      );
      return;
    }
    if (path.endsWith("/access")) {
      reply(null, 204);
      return;
    }
    if (path === "/api/v1/admin/settings/features") {
      reply([
        {
          key: "support.chat-deletion",
          enabled: true,
          version: ids.ticket,
          updatedAt: now,
        },
      ]);
      return;
    }
    if (path.includes("/settings/features/")) {
      reply({ ...body, version: ids.ticket });
      return;
    }
    if (path === "/api/v1/admin/settings/audit") {
      reply(
        paged([
          {
            id: ids.product,
            actorName: "Тест Адміністратор",
            actorRole: "Administrator",
            action: "update",
            entityType: "Product",
            entityName: product.name,
            occurredAt: now,
            changes: [{ field: "Price", before: "2699", after: "2499" }],
          },
        ]),
      );
      return;
    }
    if (path === "/api/v1/admin/telegram/mappings") {
      reply(
        method === "GET"
          ? [
              {
                id: ids.category,
                externalKey: "c12345",
                categoryId: ids.category,
                categoryName: "Електроніка",
              },
            ]
          : null,
        method === "GET" ? 200 : 204,
      );
      return;
    }
    if (/\/telegram\/sellers\/.+\/categories$/.test(path)) {
      reply(
        method === "GET"
          ? [
              {
                categoryId: ids.category,
                name: "Електроніка",
                includeDescendants: true,
              },
            ]
          : null,
        method === "GET" ? 200 : 204,
      );
      return;
    }
    if (path === "/api/security") {
      reply({
        authenticatorEnabled: false,
        emailVerified: true,
        emailTwoFactorEnabled: false,
        maskedEmail: "a***@example.test",
      });
      return;
    }
    if (path === "/api/telegram/link") {
      reply({ configured: true, linked: false });
      return;
    }
    if (path === "/api/v1/account/notifications") {
      reply({
        items: [
          {
            key: "ticket:1",
            kind: "support",
            title: "Нове звернення покупця",
            text: ticket.summary.subject,
            scope: "admin",
            path: "/support/" + ids.ticket,
            createdAt: now,
            read: false,
          },
        ],
        unreadCount: 1,
      });
      return;
    }
    if (path === "/api/v1/account/notifications/read") {
      reply(null, 204);
      return;
    }
    if (path === "/api/v1/seller/imports/options") {
      reply({
        categories: lookup,
        brands: brand,
        stores,
        canClassifyImports: true,
      });
      return;
    }
    if (path === "/api/v1/seller/imports/queue") {
      reply([
        {
          id: ids.product,
          sourceUrl: "https://example.test/product",
          status: "READY",
          previewId: ids.product,
          attempts: 1,
        },
      ]);
      return;
    }
    if (path === "/api/v1/seller/imports/" + ids.product) {
      reply({
        id: ids.product,
        name: product.name,
        description: product.description,
        brandName: product.brandName,
        brandId: ids.brand,
        categoryId: ids.category,
        categoryName: "Електроніка",
        sourcePrice: 2499,
        images: [],
        characteristics: [{ name: "Колір", value: "Чорний" }],
        duplicates: [],
        canClassifyCategory: true,
        manufacturerPartNumber: "",
        barcode: "",
      });
      return;
    }
    reply({ title: "Fixture route not implemented: " + path }, 404);
  });
  return { server, calls, ids };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { server } = createAdminFixture();
  server.listen(3199, "127.0.0.1", () =>
    console.log("Admin fixture on http://127.0.0.1:3199"),
  );
}
