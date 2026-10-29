# Integrated TREBA workspace

The administrative interface and seller workspace now live in this Next.js application at `/admin`.
The .NET repository contains the API, business services and database integrations; it no longer builds a Blazor administrative application.

## Runtime boundaries

- `(store)` owns storefront providers, catalog navigation, customer contexts and intercepted authentication dialogs. Existing public URLs are unchanged.
- `/admin` has a separate shell, navigation, styles, session bootstrap and role matrix.
- Workspace styles use the `treba-admin-` namespace. Generic `ad-*` names collide with cosmetic advertising filters, which can hide the authenticated sidebar and page content without a JavaScript error. Deployment checks use `data-treba-workspace`, independently of CSS names.
- `/admin-api` is an explicit allowlist of methods and resources. It forwards to the existing `/api/v1/admin`, seller, support, profile, security and Telegram APIs.
- Workspace cookies use the `treba_staff_*` prefix, HttpOnly, SameSite=Lax, Secure in production and Path=/ so they are available to the workspace and its server routes. Customer proxies only read `treba_*` customer cookies. A successful login clears the other session's cookies.
- Password, second-factor and external-provider flows use the existing authentication endpoints. Staff logins open `/admin` directly. Existing Blazor cookies are not imported: users sign in once after migration.
- The API remains authoritative for roles, seller ownership, allowed status transitions, version conflicts, prices, stock, refunds and audit history. No business rules are moved into the browser.
- Mutations require the same origin. Private responses are not shared-cacheable. Browser-selected URLs and arbitrary upstream headers are never forwarded.
- Access-token refresh is shared among concurrent requests in the current Node process, matching the existing single-container deployment. Multiple replicas require shared refresh coordination before scaling.

## Modules

Overview; products and variants; typed characteristics; photographs; local editor recovery including pending photograph files; moderation history and comparisons; bulk catalog changes with server preview tokens; category tree; sellers and applications; seller import; reviews; orders and delivery; support and returns; chat trash; customer activity; promotions and coupons; users; staff; features; audit; Telegram mappings; profile, avatar, account security and notifications.

Seller menus expose their catalog, orders, product questions and import. Moderators see review/product moderation and their support scope. Managers and administrators retain the existing API permissions. The customer account remains separate.

List parameters are preserved in URLs. Calendar date filters use Europe/Vilnius and an exclusive upper bound, preserving the prior panel's inclusive final day. Promotion datetime inputs explicitly use the device's local time; API timestamps remain ISO timestamps with an offset.

## Local development

Set `TREBA_API_URL` to the backend address. Set `NEXT_PUBLIC_API_URL` to its browser-accessible address for public media and storefront requests.

```powershell
npm ci
npm run dev
# Open http://localhost:3000/admin
```

`scripts/start-workspace.ps1` starts a hidden local Next.js development process, reuses an owned running process and returns its `/admin` URL. The backend's existing desktop launchers delegate to it. `docker-compose.yml` in the backend sets the server-side API URL to `http://backend:5000`.

## Verification

```powershell
npm run lint
npm run build
node --test tests/*.test.mjs
```

`tests/admin-workspace.test.mjs` runs the production Next server against a disposable local fixture. It checks all administrative read routes, cookie isolation, authorization forwarding, Origin checks, version conflicts, multipart uploads, refresh rotation and logout. Existing customer, OAuth and role-login suites cover the updated login destination and storefront behavior. Real API/domain rules remain covered by the .NET suite.

`tests/admin-cosmetic-filters.test.mjs` prevents workspace elements from reusing generic EasyList selectors. Browser regression checks should apply `tests/fixtures/admin-cosmetic-filters.css` to the production workspace: authenticated navigation and content must remain visible at desktop and mobile widths.

For visual QA only, run `node tests/helpers/admin-fixture.mjs`, then run Next with both API URL variables pointing to `http://127.0.0.1:3199`. Fixture accounts are disposable names such as `Administrator@example.test` and `Seller@example.test`; they never connect to a real database. Do not use fixture credentials with the hosted service.

The migration was checked in a browser across the administrative lists, record details, editor, settings, profile and seller import. Mobile checks cover readable filter wrapping, navigation and scrollable tables. UI screenshots use disposable fixture data.

Final verification: lint and the production build pass; all 52 frontend tests pass. Twenty-nine administrative screens were checked at desktop and mobile widths, with additional seller login/import and editor recovery/save checks. Mobile overflow defects in filters, editor columns and long moderation actions were corrected. The backend suite passes 354 tests; 19 PostgreSQL checks require a separate configured test database.

Screenshots: [desktop catalog](admin-preview/desktop.png), [mobile settings](admin-preview/mobile.png).

## Release order and recovery

1. Release this frontend and verify `/admin` returns 200, `/admin-api/session` returns 401 anonymously, and each role can complete its workflows.
2. Release the backend without the Blazor application. Its deploy script requires the integrated frontend to pass preflight before switching.
3. The legacy admin host redirects old section paths to `/admin` and old authentication entry paths to `/admin`. The old admin container is stopped only after the new release succeeds. The previous image/container and Caddy backup are retained for recovery.

No database migration is introduced by this UI move. A coordinated rollback must restore the matching frontend and Caddy routing, then start the retained old admin container if returning to the old interface. Do not roll back only the frontend after retiring that container.
