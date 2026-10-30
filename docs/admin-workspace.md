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

The workspace uses a dark navy navigation rail, a slate canvas, bordered white panels and semantic icon accents. It keeps the `treba-admin-` namespace so cosmetic ad filters do not hide navigation or content.

UK/EN is available in the top bar and on the signed-out workspace screen. The chosen language is kept in the `treba_workspace_language` preference cookie; a fresh workspace document reads it on the server. Without an explicit browser preference the user's profile language is used after sign-in. The profile form can save the account's preferred language through the existing profile API. Switching language does not remount editors or reset unsaved form data.

`src/features/admin/i18n/en.json` contains the English dictionary, keyed by the canonical Ukrainian copy. Components use `useAdminI18n` for labels, interpolation, statuses, dates, money and request errors. User-entered names, product descriptions and messages remain in their original language. Unknown server errors show a translated summary with expandable original details. `tests/admin-localization.test.mjs` checks translation coverage, interpolation and formats; component copy cannot bypass the dictionary.

The shared sign-in, registration, password recovery and Telegram Guard forms also use the dictionary. Their modal reads the same browser preference and restores the surrounding page language when closed; the language selector is available in the workspace. The storefront catalog and customer account remain outside the scope of this workspace translation.

Set `TREBA_API_URL` to the backend address. Set `NEXT_PUBLIC_API_URL` to its browser-accessible address for public media and storefront requests.

```powershell
npm ci
npm run dev
# Open http://localhost:3000/admin
```

`scripts/start-workspace.ps1` starts a hidden local Next.js development process, reuses an owned running process and returns its `/admin` URL. The backend's existing desktop launchers delegate to it. `docker-compose.yml` in the backend sets the server-side API URL to `http://backend:5000`.

## Verification

Reviews use animated status tabs and full review cards, with an approval dialog offering editable saved replies. Settings → Features manages named UK/EN templates; disabled templates are excluded from moderation without changing existing replies. The customer's first name and product title can be substituted before confirmation. Replies are stored by the API and shown below the review in the product page and customer account. This feature requires backend migration `20261030094652_AddReviewRepliesAndTemplates` and the matching API before releasing the new frontend. Local changes do not apply that migration to a production database.

Profile photo selection uses a localized upload button and a client-side crop dialog with dragging, keyboard positioning, zoom and reset. Only the confirmed 512px square PNG is uploaded through the existing avatar API. The header uses the saved avatar immediately, falls back to initials when missing, and follows profile changes without a full reload. Cancelling leaves the saved photo unchanged; photo operations preserve unsaved personal fields.

Product moderation uses full read-only review cards, with a gallery, descriptions, seller/store metadata, attributes, variant prices/stock, and expandable moderation history and resubmission comparisons. The default sequential mode supports previous/next navigation across pages; all-products mode shows every card on the current page. Both retain filters and URL navigation. A confirmed decision removes only that product, updates the pending count, and advances the sequential review; removing a final page returns to an existing page. Rejection templates can be edited before submission, and request errors preserve the entered reason. All interface copy supports UK/EN.

The local moderation fixture (`node tests/helpers/admin-fixture.mjs --moderation`) includes multiple products, variant/attribute scopes, a missing image and a failed-image example. `tests/admin-moderation.test.mjs` covers pending-only query isolation, page navigation, queue removal and typed attribute values. Browser checks cover all/single modes, gallery/history, mobile English, failed decisions, final-page removal and empty filtered/global queues.

Authenticator and email verification setup/disable flows open in a modal. QR codes, manual keys, challenge codes, loading, retries and errors stay inside that dialog; the profile card shows the resulting status. Closing clears temporary codes and restores focus to the triggering button. These UI changes introduce no backend or database changes.

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

The refreshed workspace and UK/EN release passes lint, the production build and all 59 frontend tests. Thirty workspace routes were checked at desktop and 390px mobile widths, with additional seller/import and localized sign-in/recovery checks. Switching UK/EN preserves editor input; profile language changes persist through the existing API. Current examples: [Ukrainian desktop workspace](admin-preview/desktop-workspace-uk.png), [English mobile workspace](admin-preview/mobile-workspace-en.png).

## Local support inbox update

Support now uses a conversation list and a reading pane. Clicking a ticket opens its history directly; the former table and action column are removed. At widths up to 800px, the list and conversation become separate views with a back link. Queue filters, search, pagination and selection are URL based (`/admin/support?ticket=<id>`); existing `/admin/support/<id>` links still open the inbox with that conversation selected.

The inbox retains create, reply, internal note, earlier-message pagination, allowed status transitions and versioned soft delete/restore. Read receipts are sent when a conversation opens; failed receipts offer a retry. Reply drafts and their retry identifiers remain in memory while switching conversations. Failed sends retain the text, successful sends clear it, closed tickets show history without a composer. Internal notes use a distinct amber treatment. Trash shows ticket metadata and restore; deleted history remains unavailable until restored, matching the existing API.

All interface copy has UK/EN translations. Support uses the existing API and introduces no new backend contract or migration. Delete/restore visibility follows `support/capabilities`, including the existing feature flag and staff roles. Run `node tests/helpers/admin-fixture.mjs --support` for disposable multi-ticket visual QA. The support helper tests cover queue URLs, selection and message merging; the production proxy test covers create/read/send failures, version conflicts, close/delete/restore with retained history. Local UI checks cover desktop/mobile, UK/EN, filters, draft switching, internal notes, earlier history and recovery actions.

## Release order and recovery

The subsequent local TurboSMS/import changes allow the existing SMS feature endpoint through the proxy and use feature-specific UK/EN copy with Enabled/Disabled badges. Import Review opens a wide, responsive modal with fixed header/actions, loading/retry and retained input after a failed submit. API status casing and Expired → Retry are handled. Source identifiers and compatible attribute values are prefilled, and source warnings/specifications stay visible for review. The backend's generic HTTPS store parser and Rozetka subdomain support are documented in `treba-backend2/docs/product-link-import.md`. These additions are still local. Latest checks: lint, production build and 82 frontend tests pass; backend verification passes 385 tests with 19 database-specific skips.

1. Release this frontend and verify `/admin` returns 200, `/admin-api/session` returns 401 anonymously, and each role can complete its workflows.
2. Release the backend without the Blazor application. Its deploy script requires the integrated frontend to pass preflight before switching.
3. The legacy admin host redirects old section paths to `/admin` and old authentication entry paths to `/admin`. The old admin container is stopped only after the new release succeeds. The previous image/container and Caddy backup are retained for recovery.

No database migration is introduced by this UI move. A coordinated rollback must restore the matching frontend and Caddy routing, then start the retained old admin container if returning to the old interface. Do not roll back only the frontend after retiring that container.
