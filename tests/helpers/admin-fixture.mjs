// Disposable local API for UI/transport tests. It never connects to the production database.
import http from "node:http";
import { randomUUID } from "node:crypto";
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
export function createAdminFixture({ moderation = false, reviews = false, support = false, imports = false } = {}) {
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
  const extraProducts = [];
  if (moderation) {
    product.images = [
      { id: ids.product, imageUrl: "/fixtures/review-front.svg", altText: "Air Studio — front", isMain: true, sortOrder: 0 },
      { id: ids.message, imageUrl: "/fixtures/review-back.svg", altText: "Air Studio — back", isMain: false, sortOrder: 1 },
    ];
    product.variants = [
      { id: ids.product, name: "Чорний", sku: "AIR-001-BK", price: 2499, oldPrice: 2999, stockQuantity: 24, barcode: "1234567890123", isActive: true },
      { id: ids.message, name: "Білий", sku: "AIR-001-WH", price: 2699, oldPrice: null, stockQuantity: 0, barcode: null, isActive: false },
    ];
    product.attributes = [
      { attributeId: ids.brand, stringValue: "Чорний", variantId: ids.product },
      { attributeId: ids.category, numberValue: 30 },
      { attributeId: ids.store, boolValue: false },
      { attributeId: ids.seller, optionId: ids.order },
      { attributeId: ids.seller, optionId: ids.ticket },
    ];
    extraProducts.push(
      { ...product, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Портативна колонка Sound Mini", sku: "SOUND-002", slug: "sound-mini", price: 1299, stockQuantity: 8, updatedAt: "2026-10-28T09:00:00Z", shortDescription: "Компактна колонка для музики щодня", description: "Портативна колонка з Bluetooth.\nДо 12 годин роботи та захист від бризок.", images: [], variants: [], attributes: [] },
      { ...product, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", name: "Зарядний пристрій Power 65W", sku: "POWER-003", slug: "power-65w", price: 899, stockQuantity: 0, updatedAt: "2026-10-27T08:00:00Z", shortDescription: "Швидке заряджання USB-C", description: "Компактний зарядний пристрій потужністю 65 Вт.", images: [{ ...product.images[0], imageUrl: "/fixtures/missing-image.png" }], variants: [], attributes: [] },
    );
  }
  const catalogProducts = () => [product, ...extraProducts];
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
  const supportTickets = new Map([[ids.ticket, ticket]]);
  const supportEarlier = new Map();
  const allowedSupportStatuses = (row) => row.status === "CLOSED" ? [] : row.kind === "RETURN" ? row.status === "APPROVED" || row.status === "REJECTED" ? ["CLOSED"] : ["APPROVED", "REJECTED"] : row.status === "OPEN" ? ["IN_PROGRESS", "CLOSED"] : ["CLOSED"];
  if (support) {
    ticket.messages.push({ id: ids.order, authorName: "Команда TREBA", authorRole: "Manager", message: "Вітаю, Олено! Замовлення вже передано перевізнику. Очікувана доставка — завтра до кінця дня.", internal: false, createdAt: "2026-10-29T10:04:00Z" },
      { id: ids.category, authorName: "Олена Коваль", authorRole: "Customer", message: "Дякую! А номер відстеження вже є? Хочу спланувати отримання.", internal: false, createdAt: "2026-10-29T10:07:00Z" });
    ticket.summary.lastMessage = ticket.messages.at(-1).message;
    ticket.summary.updatedAt = "2026-10-29T10:07:00Z";
    ticket.summary.unreadCount = 2;
    ticket.hasEarlierMessages = true;
    supportEarlier.set(ids.ticket, [{ id: ids.brand, authorName: "Олена Коваль", authorRole: "Customer", message: "Вітаю! У мене є питання щодо замовлення.", internal: false, createdAt: "2026-10-28T16:00:00Z" }]);
    for (const [id, customer, subject, kind, status, message, updatedAt, unreadCount, deletedAt] of [
      [ids.category, "Андрій Мельник", "Допоможіть обрати навушники", "CHAT", "OPEN", "Потрібні навушники для роботи та подорожей. Що порадите?", "2026-10-29T09:40:00Z", 1, null],
      [ids.brand, "Софія Бондар", "Повернення замовлення TRB-1042", "RETURN", "APPROVED", "Посилку з поверненням відправила. Додаю номер для відстеження.", "2026-10-29T09:20:00Z", 0, null],
      [ids.store, "Максим Ткаченко", "Питання щодо оплати", "QUESTION", "CLOSED", "Дякую за допомогу, оплату отримано!", "2026-10-28T15:30:00Z", 0, null],
      [ids.promotion, "Ірина Савчук", "Уточнення адреси доставки", "CHAT", "CLOSED", "Дякую, адресу оновлено.", "2026-10-27T11:00:00Z", 0, "2026-10-28T12:00:00Z"],
    ]) {
      const summary = { ...ticket.summary, id, customerName: customer, subject, kind, status, lastMessage: message, updatedAt, unreadCount, version: id, deletedAt };
      supportTickets.set(id, { summary, allowedStatuses: allowedSupportStatuses(summary), hasEarlierMessages: false,
        messages: [{ id: randomUUID(), authorName: customer, authorRole: "Customer", message, internal: false, createdAt: updatedAt }] });
    }
  }
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
    productId: ids.product,
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
  const reviewRows = [review, ...(reviews ? [
    { ...review, id: ids.order, productId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", productName: "Портативна колонка Sound Mini", authorName: "Андрій Мельник", authorEmail: "andrii@example.test", title: "Компактна і зручна", comment: "Дуже зручно брати з собою. Хотілося б трохи більше басів.", rating: 4 },
    { ...review, id: ids.ticket, productName: "Навушники Studio White", title: "Вдала покупка", comment: "Усе працює, отримала наступного дня.", status: "PUBLISHED", staffReply: "Дякуємо за ваш відгук! Приємно, що ви задоволені покупкою.", staffRepliedAt: now, rating: 5 },
    { ...review, id: ids.message, authorName: "Максим Тестовий", authorEmail: "max@example.test", title: "Потрібне уточнення", comment: "Текст відгуку на повторну перевірку.", status: "REJECTED", verifiedPurchase: false, rating: 2 },
  ] : [])];
  const replyTemplates = [
    { id: ids.brand, name: "Подяка за відгук", textUk: "{customer}, дякуємо за ваш відгук! Раді, що ви поділилися враженнями про {product}.", textEn: "{customer}, thank you for your review! We appreciate you sharing your experience with {product}.", enabled: true, version: ids.brand, updatedAt: now },
    { id: ids.category, name: "Раді вдалим покупкам", textUk: "Дякуємо, що обираєте TREBA! Приємно знати, що {product} виправдав ваші очікування.", textEn: "Thank you for choosing TREBA! We are glad that {product} met your expectations.", enabled: true, version: ids.category, updatedAt: now },
    { id: ids.store, name: "Допомога з покупкою", textUk: "{customer}, дякуємо за зворотний зв’язок. Будь ласка, зверніться до підтримки TREBA з номером замовлення, щоб ми могли допомогти.", textEn: "{customer}, thank you for your feedback. Please contact TREBA support with your order number so we can help.", enabled: true, version: ids.store, updatedAt: now },
  ];
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
  const profileEdits = new Map();
  const avatars = new Map();
  let avatarSequence = 0;
  const securityStates = new Map();
  const securityChallenges = new Map();
  let challengeSequence = 0;
  const security = role => ({ authenticatorEnabled: false, emailVerified: true, emailTwoFactorEnabled: false, maskedEmail: "a***@example.test", ...securityStates.get(role) });
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
    ...profileEdits.get(role),
  });
  const auth = (role, expired = false) => ({
    userId: ids.user,
    ...profile(role),
    accessToken: `fixture-${role}`,
    refreshToken: `refresh-${role}`,
    expiresAt: new Date(Date.now() + (expired ? -1000 : 3600000)).toISOString(),
  });
  const featureFlags = new Map([
    ["support.chat-deletion", { key: "support.chat-deletion", enabled: true, version: ids.ticket, updatedAt: now }],
    ["notifications.sms-sending", { key: "notifications.sms-sending", enabled: false, version: "00000000-0000-0000-0000-000000000000", updatedAt: null }],
  ]);
  const importJobs = [{ id: ids.product, sourceUrl: "https://auto.rozetka.com.ua/ua/rubeg_op2/p2119937/", status: "Ready", previewId: ids.product, attempts: 1 }];
  if (imports) importJobs.push(
    { id: ids.category, sourceUrl: "https://shop.example.test/expired", status: "Expired", previewId: ids.category, attempts: 1 },
    { id: ids.brand, sourceUrl: "https://shop.example.test/retry", status: "Failed", error: "Не вдалося виконати запит.", attempts: 1 },
    { id: ids.store, sourceUrl: "https://shop.example.test/preview-retry", status: "Ready", previewId: ids.store, attempts: 1 });
  const importPreviews = new Map(); let previewUnavailable = imports;
  const importPreview = (id) => {
    if (!importPreviews.has(id)) importPreviews.set(id, { id, sourceUrl: importJobs.find(job => job.previewId === id)?.sourceUrl,
      name: product.name, description: product.description, brandName: product.brandName, brandId: ids.brand,
      categoryId: ids.category, categoryName: "Електроніка", sourcePrice: 2499, sourceSku: "STUDIO-001", sourceCurrency: "UAH",
      images: imports ? ["http://127.0.0.1:3199/fixtures/review-front.svg", "http://127.0.0.1:3199/fixtures/review-back.svg"] : [], characteristics: [{ name: "Колір", value: "Чорний" }], duplicates: [], canClassifyCategory: true, manufacturerPartNumber: "ST-42", barcode: "4820000000001" });
    return importPreviews.get(id);
  };
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
    if (method === "GET" && /^\/fixtures\/review-(front|back)\.svg$/.test(path)) {
      const back = path.includes("back");
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700"><rect width="700" height="700" fill="#f9fbff"/><circle cx="350" cy="330" r="230" fill="${back ? "#e5f7f2" : "#e8eeff"}"/><path d="M210 375V285a140 140 0 0 1 280 0v90" fill="none" stroke="#24345a" stroke-width="42"/><rect x="168" y="310" width="98" height="175" rx="45" fill="${back ? "#39b6aa" : "#3d57ef"}"/><rect x="434" y="310" width="98" height="175" rx="45" fill="${back ? "#39b6aa" : "#3d57ef"}"/><path d="M205 350v95M496 350v95" stroke="#fff" stroke-width="8" stroke-linecap="round"/><text x="350" y="590" text-anchor="middle" font-family="Arial" font-size="28" fill="#24345a">AIR STUDIO · ${back ? "02" : "01"}</text></svg>`);
      return;
    }
    if (method === "GET" && avatars.has(path)) {
      const image = avatars.get(path);
      res.writeHead(200, { "Content-Type": image.type });
      res.end(image.bytes);
      return;
    }
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
    if (path === `/api/v1/reviews/products/${ids.product}`) {
      const items = reviewRows.filter(value => value.status === "PUBLISHED");
      reply({ items, page: 1, pageSize: 20, totalCount: items.length, totalPages: 1 });
      return;
    }
    const role = req.headers.authorization?.replace("Bearer fixture-", "");
    if (!role) {
      reply({}, 401);
      return;
    }
    if (path === "/api/users/me") {
      if (method === "PATCH") {
        const current = profile(role);
        profileEdits.set(role, {
          ...current,
          ...body,
          profile: {
            ...current.profile,
            language: body.language,
            marketingEmailsEnabled: body.marketingEmailsEnabled,
          },
        });
      }
      reply(profile(role));
      return;
    }
    if (path === "/api/v1/reviews/mine") {
      reply({ items: reviewRows, page: 1, totalCount: reviewRows.length, totalPages: 1 });
      return;
    }
    if (path === "/api/v1/reviews/awaiting") {
      reply({ items: [], page: 1, totalCount: 0, totalPages: 0 });
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
      const current = profile(role);
      let avatarUrl = null;
      if (method === "POST") {
        const form = await new Request("http://fixture/avatar", {
          method: "POST",
          headers: { "Content-Type": req.headers["content-type"] },
          body: raw,
        }).formData();
        const avatar = form.get("avatar");
        if (!avatar || typeof avatar === "string") {
          reply({ message: "Avatar is required" }, 400);
          return;
        }
        const bytes = Buffer.from(await avatar.arrayBuffer());
        const imagePath = `/uploads/avatars/fixture-${role}-${++avatarSequence}.png`;
        avatars.set(imagePath, { bytes, type: avatar.type });
        avatarUrl = `http://${req.headers.host}${imagePath}`;
        calls.at(-1).upload = { name: avatar.name, type: avatar.type, bytes: bytes.length };
      }
      if (current.profile.avatarUrl)
        avatars.delete(new URL(current.profile.avatarUrl).pathname);
      profileEdits.set(role, { ...current, profile: { ...current.profile, avatarUrl } });
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
        ...(moderation ? [
          { id: ids.category, name: "Автономність", type: "NUMBER", unit: "год", isRequired: false, options: [] },
          { id: ids.store, name: "Вологозахист", type: "BOOL", isRequired: false, options: [] },
          { id: ids.seller, name: "Підключення", type: "MULTI_SELECT", isRequired: false, options: [{ id: ids.order, name: "Bluetooth" }, { id: ids.ticket, name: "USB-C" }] },
        ] : []),
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
      let content = catalogProducts();
      const status = url.searchParams.get("status");
      if (status) content = content.filter(value => value.status === status);
      const search = url.searchParams.get("search")?.toLowerCase();
      if (search) content = content.filter(value => [value.name, value.sku, value.storeName, value.sellerName].join(" ").toLowerCase().includes(search));
      for (const key of ["categoryId", "brandId"])
        if (url.searchParams.get(key)) content = content.filter(value => value[key] === url.searchParams.get(key));
      const waiting = Number(url.searchParams.get("waitingHours"));
      if (waiting) content = content.filter(value => new Date(value.updatedAt).getTime() <= new Date(now).getTime() - waiting * 3600000);
      const sort = url.searchParams.get("sort");
      if (sort === "waiting") content.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      if (sort === "updated") content.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      if (sort === "nameasc") content.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === "priceasc") content.sort((a, b) => a.price - b.price);
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
      const size = Math.max(1, Math.min(100, Number(url.searchParams.get("size")) || 20));
      reply({ content: content.slice((page - 1) * size, page * size).map(value => ({ ...value, images: value.images.map(image => ({ ...image, imageUrl: image.imageUrl.startsWith("/fixtures/") ? `http://${req.headers.host}${image.imageUrl}` : image.imageUrl })) })), page, size, totalElements: content.length, totalPages: Math.ceil(content.length / size) });
      return;
    }
    if (path === "/api/v1/admin/catalog/moderation/pending-count") {
      reply(catalogProducts().filter(value => value.status === "PENDING_MODERATION").length);
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
      const reviewed = catalogProducts().find(value => path.includes(value.id));
      if (!reviewed) { reply({}, 404); return; }
      if (body.reason === "fixture-error") { reply({ message: "Не вдалося виконати запит." }, 503); return; }
      reviewed.status = path.endsWith("approve")
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
      if (method === "POST") {
        const id = body.clientRequestId || randomUUID();
        if (!supportTickets.has(id)) {
          const summary = { ...ticket.summary, id, version: id, subject: body.subject, kind: body.kind, status: "OPEN", orderId: body.orderId, unreadCount: 0, lastMessage: body.message, updatedAt: new Date().toISOString() };
          supportTickets.set(id, { summary, allowedStatuses: allowedSupportStatuses(summary), hasEarlierMessages: false,
            messages: [{ id: randomUUID(), message: body.message, internal: false, authorName: "Тест Адміністратор", authorRole: role, createdAt: summary.updatedAt }] });
        }
        reply(supportTickets.get(id)); return;
      }
      const deleted = path.endsWith("/deleted");
      const search = url.searchParams.get("search")?.toLowerCase();
      let content = [...supportTickets.values()].map(value => value.summary).filter(row => !!row.deletedAt === deleted);
      if (search) content = content.filter(row => [row.subject, row.customerName, row.orderNumber].some(value => value?.toLowerCase().includes(search)));
      if (!deleted) {
        for (const key of ["status", "kind", "orderId"]) if (url.searchParams.get(key)) content = content.filter(row => row[key] === url.searchParams.get(key));
        const view = url.searchParams.get("view");
        if (view === "unread") content = content.filter(row => row.unreadCount > 0);
        if (view === "open" || view === "overdue") content = content.filter(row => !["CLOSED", "REJECTED"].includes(row.status));
      }
      content.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1), size = 12;
      reply({ content: content.slice((page - 1) * size, page * size), page, size, totalElements: content.length, totalPages: Math.ceil(content.length / size) }); return;
    }
    const supportRoute = /^\/api\/v1\/support\/([^/]+)(?:\/(messages|status|read|restore))?$/.exec(path);
    if (supportRoute) {
      const selectedTicket = supportTickets.get(supportRoute[1]), operation = supportRoute[2];
      if (!selectedTicket || (selectedTicket.summary.deletedAt && operation !== "restore")) { reply({ message: "Ticket not found" }, 404); return; }
      if (method === "GET") {
        reply(operation === "messages" ? { messages: supportEarlier.get(supportRoute[1]) ?? [], hasMore: false } : selectedTicket); return;
      }
      if (operation === "read") { selectedTicket.summary.unreadCount = 0; reply(null, 204); return; }
      if (operation === "messages") {
        if (body.message === "fixture-error") { reply({ message: "Не вдалося виконати запит." }, 503); return; }
        if (selectedTicket.summary.status === "CLOSED") { reply({ message: "Closed tickets cannot receive messages." }, 400); return; }
        if (!selectedTicket.messages.some(message => message.id === body.clientMessageId)) {
          selectedTicket.messages.push({ id: body.clientMessageId || randomUUID(), authorName: "Тест Адміністратор", authorRole: role, message: body.message, internal: body.internal, createdAt: new Date().toISOString() });
          selectedTicket.summary.lastMessage = body.message;
          if (!body.internal && selectedTicket.summary.status === "OPEN") selectedTicket.summary.status = "IN_PROGRESS";
        }
      } else {
        if (body.expectedVersion !== selectedTicket.summary.version) { reply({ message: "Version conflict" }, 409); return; }
        if (operation === "restore") selectedTicket.summary.deletedAt = null;
        else if (method === "DELETE") {
          if (selectedTicket.summary.kind === "RETURN" && selectedTicket.summary.status !== "CLOSED") { reply({ message: "Complete the return first." }, 400); return; }
          selectedTicket.summary.deletedAt = new Date().toISOString();
        } else if (operation === "status") {
          const previous = selectedTicket.summary.status;
          if (!allowedSupportStatuses(selectedTicket.summary).includes(body.status)) { reply({ message: "Invalid status transition" }, 400); return; }
          selectedTicket.summary.status = body.status;
          selectedTicket.messages.push({ id: randomUUID(), authorName: "Тест Адміністратор", authorRole: role, message: previous + " → " + body.status, internal: false, createdAt: new Date().toISOString() });
        }
      }
      selectedTicket.summary.version = randomUUID(); selectedTicket.summary.updatedAt = new Date().toISOString();
      selectedTicket.allowedStatuses = allowedSupportStatuses(selectedTicket.summary);
      reply(null, 204); return;
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
      let content = reviewRows;
      const status = url.searchParams.get("status"), search = url.searchParams.get("search")?.toLowerCase();
      if (status) content = content.filter(value => value.status === status);
      if (search) content = content.filter(value => [value.productName, value.authorName, value.authorEmail, value.title, value.comment].join(" ").toLowerCase().includes(search));
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1), size = Math.max(1, Number(url.searchParams.get("size")) || 20);
      reply({ content: content.slice((page - 1) * size, page * size), page, size, totalElements: content.length, totalPages: Math.ceil(content.length / size) });
      return;
    }
    if (path === "/api/v1/admin/reviews/pending-count") { reply(reviewRows.filter(value => value.status === "PENDING").length); return; }
    if (path === "/api/v1/admin/reviews/reply-templates") { reply(replyTemplates.filter(value => value.enabled)); return; }
    if (path.startsWith("/api/v1/admin/settings/review-replies")) {
      if (method === "GET") { reply(replyTemplates); return; }
      if (body.name === "fixture-error") { reply({ message: "Не вдалося виконати запит." }, 503); return; }
      if (!body.name?.trim() || !body.textUk?.trim() || !body.textEn?.trim() || body.textUk.length > 2000 || body.textEn.length > 2000) { reply({}, 400); return; }
      const id = path.split("/").at(-1);
      let template = replyTemplates.find(value => value.id === id);
      if (method === "PUT" && template?.version !== body.expectedVersion) { reply({}, 409); return; }
      if (!template) { template = { id: randomUUID() }; replyTemplates.push(template); }
      Object.assign(template, { name: body.name, textUk: body.textUk, textEn: body.textEn, enabled: body.enabled, version: randomUUID(), updatedAt: now });
      reply(template); return;
    }
    if (path.endsWith("/moderate")) {
      const row = reviewRows.find(value => path.includes(value.id));
      if (!row) { reply({}, 404); return; }
      if (body.reply === "fixture-error") { reply({ message: "Не вдалося виконати запит." }, 503); return; }
      if (body.reply?.length > 2000 || !["PUBLISHED", "REJECTED"].includes(body.status)) { reply({}, 400); return; }
      row.status = body.status;
      if (body.reply !== undefined) { row.staffReply = body.reply.trim() || null; row.staffRepliedAt = row.staffReply ? now : null; }
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
    if (path === "/api/v1/admin/settings/features") { reply([...featureFlags.values()]); return; }
    if (path.includes("/settings/features/")) {
      const key = path.split("/").at(-1), row = featureFlags.get(key);
      if (role !== "Administrator") { reply({}, 403); return; }
      if (!row) { reply({}, 404); return; }
      if (row.version !== body.expectedVersion) { reply({ message: "Version conflict" }, 409); return; }
      Object.assign(row, { enabled: body.enabled, version: randomUUID(), updatedAt: new Date().toISOString() });
      reply(row); return;
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
      reply(security(role));
      return;
    }
    if (path === "/api/security/authenticator/setup") {
      // A clearly marked placeholder, never a real OTP secret or functional QR.
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="white"/><path d="M15 15h45v45H15zM120 15h45v45h-45zM15 120h45v45H15zM80 25h20v25H80zM75 75h30v30H75zM120 90h45v15h-45zM90 120h15v45H90zM125 130h30v25h-30z" fill="#223259"/><text x="90" y="177" text-anchor="middle" font-size="9">TEST FIXTURE</text></svg>';
      reply({ manualKey: "FIXTUREONLYNOTASECRET", qrCodeDataUrl: "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64") });
      return;
    }
    if (/^\/api\/security\/email\/(setup|disable\/start)$/.test(path)) {
      const challengeId = `fixture-email-${++challengeSequence}`;
      securityChallenges.set(role, challengeId);
      reply({ challengeId, maskedEmail: security(role).maskedEmail });
      return;
    }
    if (/^\/api\/security\/(authenticator\/(confirm|disable)|email\/(confirm|disable\/confirm))$/.test(path)) {
      if (body.code !== "123456" || (path.includes("/email/") && body.challengeId !== securityChallenges.get(role))) {
        reply({ message: "Invalid verification code." }, 400);
        return;
      }
      const current = security(role);
      securityStates.set(role, { ...current, [path.includes("/authenticator/") ? "authenticatorEnabled" : "emailTwoFactorEnabled"]: !path.includes("/disable") });
      reply(null, 204);
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
      if (method === "POST") for (const item of body.items ?? []) {
        const id = randomUUID(); importJobs.unshift({ id, sourceUrl: item.url, status: "Ready", previewId: id, attempts: 1 });
      }
      reply(importJobs); return;
    }
    if (/\/imports\/queue\/[^/]+\/retry$/.test(path)) {
      const job = importJobs.find(job => job.id === path.split("/").at(-2));
      if (!job) { reply({},404); return; } job.status = "Ready"; job.previewId = job.id; job.error = null; reply(null,204); return;
    }
    const importRoute = /^\/api\/v1\/seller\/imports\/([^/]+)(?:\/(category|brand|submit))?$/.exec(path);
    if (importRoute) {
      const id = importRoute[1], operation = importRoute[2], value = importPreview(id);
      if (!operation && method === "GET") {
        if (id === ids.store && previewUnavailable) { previewUnavailable = false; reply({ message: "Не вдалося виконати запит." },503); return; }
        reply(value); return;
      }
      if (operation === "category") { value.categoryId = body.categoryId || ids.category; reply(value); return; }
      if (operation === "brand") { const row = { id: randomUUID(), name: body.name }; brand.push(row); reply(row); return; }
      if (operation === "submit") {
        if (body.name === "fixture-error") { reply({ message: "Не вдалося виконати запит." },503); return; }
        Object.assign(product, { name: body.name, description: body.description, shortDescription: body.description.slice(0,500), sku: body.sku,
          manufacturerPartNumber: body.manufacturerPartNumber, brandId: body.brandId, storeId: body.storeId, price: body.price, stockQuantity: body.stockQuantity,
          variants: [{ id: ids.product, name: "Основний", sku: body.sku, barcode: body.barcode, price: body.price, oldPrice: null, stockQuantity: body.stockQuantity, isActive: true }] });
        value.productId = ids.product; const job = importJobs.find(job => job.previewId === id); if (job) { job.status = "Submitted"; job.productId = ids.product; }
        reply({ productId: ids.product }); return;
      }
    }
    reply({ title: "Fixture route not implemented: " + path }, 404);
  });
  return { server, calls, ids };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { server } = createAdminFixture({ moderation: process.argv.includes("--moderation"), reviews: process.argv.includes("--reviews"), support: process.argv.includes("--support"), imports: process.argv.includes("--imports") });
  server.listen(3199, "127.0.0.1", () =>
    console.log("Admin fixture on http://127.0.0.1:3199"),
  );
}
