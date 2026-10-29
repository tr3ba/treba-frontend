# Registration verification

Deploy this storefront with the matching `treba-backend2` registration API update.
Registration requires an explicit email/SMS choice and completes only after verification.
The server exposes available methods via `GET /api/auth/registration/methods`; the browser
uses the same-origin `/shop-api/registration/methods` proxy and never receives provider credentials.

`register` now returns a challenge rather than a user. The session proxy issues HttpOnly
cookies only after `registration-verify` succeeds. `registration-resend` returns a replacement
challenge ID, which the form stores along with the resend cooldown and code expiry.
Unavailable methods are disabled, and no method is preselected.

Set `TurboSms__Token` on the **backend server**, then enable **Settings → Features → SMS sending**
in the admin panel. The SMS sender is **MAGAZIN**. No storefront token or public environment
variable is needed. Email continues to use the backend's existing SMTP configuration.

Validation: `npm run build`, targeted ESLint/TypeScript checks and
`node --test tests/registration.test.mjs tests/external-auth.test.mjs`.
Tests use a fake backend and send no paid SMS.

The login dialog's **Forgot password?** button opens recovery with the same email/SMS choice.
`/shop-api/password-reset/methods` exposes availability, and session actions
`password-reset-request` / `password-reset-complete` proxy the backend confirmation flow.
Requests never create a session. Successful reset clears old customer and staff handoff cookies,
then asks the user to sign in normally; existing two-factor checks still apply.
Only confirmed account contacts can receive recovery codes. Resend requests replace the challenge ID.
Run `node --test tests/password-reset.test.mjs` after building to verify the proxy and cookie behavior.
