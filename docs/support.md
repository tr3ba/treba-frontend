# Customer support

The home page's “Чат з TREBA” link opens `/account/messages?new=chat`. A product's “Задати питання” link opens a private product conversation in the same inbox. Product URLs use slugs while API requests use the catalog UUID stored in `Product.backendId`.

The inbox displays actual API conversations, messages, unread counts and statuses. It polls every five seconds while the page is visible and loads older history in pages of 50. Sending retries preserve the client message/request UUID. Closed threads remain readable and offer a new personal conversation. Customers never receive internal staff notes.

Login and registration now use the backend accounts rather than browser demo identities. Email and authenticator second-factor challenges are supported when required by the account. The previous demo identities/passwords are removed from browser storage; those accounts must be registered in the API to use support. Existing account preference editing remains local and is not expanded by this change.

Next.js handles `/shop-api/session` and an allowlisted `/shop-api/support` proxy. Access and refresh tokens stay in HttpOnly, SameSite=Lax cookies, with Secure enabled in production. Mutations check Origin against Host. Refresh requests share an in-flight rotation; “remember me” controls persistent vs browser-session cookies. These frontend paths intentionally avoid `/api/*`, which Caddy already routes to WebApi.

Set `TREBA_API_URL` for the server-side proxy, or use the existing `NEXT_PUBLIC_API_URL` build setting. The production fallback is `https://treba.duckdns.org`. Publish the backend migration `20261020104554_AddSupportConversations` and matching API before publishing this frontend.

Validation:

```sh
npm ci
npm run build
node --test tests/support-session.test.mjs
```

The session integration test starts the production Next.js server against a local fixture API. It checks cookie flags, CSRF rejection, profile authentication, proxy boundaries, rotating refresh, remember-me and logout. The linked backend suite checks ownership, staff policies, note privacy, message pagination, retries and PostgreSQL constraints.
