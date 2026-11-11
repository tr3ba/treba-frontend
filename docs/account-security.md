# Account credential changes

The account page and staff profile share the Email and social sign-ins panel. Generic profile edits keep the current email address. Use the explicit confirmation flow to change it.

This frontend requires the backend operations on `fix/amonezeer-security-tasks`:

- `POST /api/auth/reauthenticate` verifies the current account password and returns its MFA challenge without creating a login session.
- `POST /api/auth/external/reauth/code` confirms an OAuth identity already linked to the current account, then returns its MFA challenge.
- `POST /api/users/me/email-change` receives the target address and raw current MFA proof. Confirmation requires independent current-mail and new-mail codes.
- `POST /api/users/me/external-link-confirmation` sends the current-account confirmation code.
- `POST /api/auth/external/link/code` exchanges the provider authorization code and links it using the current-account confirmation. It never calls the ordinary provider login/register flow.

The `/shop-api/account-security` proxy supports customer and staff cookies independently, validates the current backend profile and uses exact endpoint mappings. Writes require the same origin. Successful email changes and email-factor activation clear the appropriate local cookies and return the user to sign-in. Transient upstream failures retain any already rotated session cookies.

OAuth linking and reauthentication start with same-origin POSTs to `/shop-api/external/{provider}/start`. Their HttpOnly transaction cookie records intent, original account, scope, expiry and browser state. Linking confirmation codes are kept in that bounded cookie and are never included in provider redirect URLs or client storage. Callbacks require the same current account and preserve its session. Ordinary OAuth sign-in remains separate.

Email or Authenticator proofs are sent directly to the credential-change operation. The normal login verification endpoint would consume the challenge and issue a new session, so this panel does not use it. Telegram-only accounts can enable the verified email factor first, sign in again, and then use it for the change.

Registration resends use the backend's new opaque response. Display method and masked destination remain from the original form, while challenge identity and timing are updated. Image URLs retain their complete signed query strings.

Validation:

```sh
npm ci
npm run build
npm run lint
node --test tests/account-security.test.mjs tests/account-security-state.test.mjs tests/external-auth.test.mjs tests/registration.test.mjs tests/admin-localization.test.mjs
```

Tests use local mock providers and verify customer/staff isolation, current-account binding, browser state, cancellation, token confidentiality, renewal on upstream errors and clearing cookies after contact/factor changes. A real Google/Facebook consent flow requires the configured provider credentials and backend branch on the staging environment.
