# Marketplace workflows

The storefront depends on the backend marketplace-workflows release and its database migration.

- `/sell` submits authenticated customer applications to the backend, shows pending/approved/rejected state, and permits correcting a rejection. Company, store and tax details are required. Existing staff/sellers use their workspace.
- `/search` and `/catalog/[categoryId]` use server search and category descendants, price/brand/stock/attribute filters, sorting and pagination. Filters are shareable URL query parameters. Empty categories remain usable.
- `/account` saves allowlisted profile/delivery preferences on the server using an optimistic version. Local demo identities and preference persistence are no longer the source of account data.
- `/account/orders` and `/account/orders/[id]` show owned orders, saved prices, delivery and status history. Support links attach the order to the conversation.
- The header bell and `/account/notifications` show a role-scoped feed with read receipts. The feed polls every 30 seconds and preserves direct admin destinations through the website login handoff.

Authenticated account requests pass through the strict `/shop-api/account/[...segments]` proxy and HttpOnly session cookies. No access/refresh tokens are exposed to client JavaScript.
Application approval revokes the former customer session; sign in again to receive the Seller role and enter the workspace.
Notifications are in-app and cover recent events from the last 30 days; outbound email/SMS/Telegram delivery is separate.
Payment provider integration is also separate.

Validation: `npm run build`, ESLint on changed TypeScript files, and `node --test tests/*.test.mjs`.
The latter starts the production server with a controlled backend fixture and checks authenticated account/support proxy contracts alongside query and role-navigation tests.
