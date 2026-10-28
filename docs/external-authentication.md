# Google and Facebook sign-in

The Google and Facebook buttons on both login and registration pages start a server-mediated OAuth authorization code flow. New users become Customers. Existing users keep their account and configured second factor, including email, Authenticator or Telegram Guard.

Configure provider credentials only on the backend. The website fetches the enabled providers from `/api/auth/external/providers`; it does not need public build-time secrets or provider SDKs. `TREBA_API_URL` remains the server API address. Optional `TREBA_STORE_ORIGIN` must match the backend's `ExternalAuth:StoreOrigin`; production defaults to the public request host over HTTPS.

Provider consoles must allow the existing public redirect URIs:

```text
https://treba.duckdns.org/api/auth/external/google/callback
https://treba.duckdns.org/api/auth/external/facebook/callback
```

WebApi relays those responses to `/shop-api/external/{provider}/callback`. Next.js checks the state in an expiring HttpOnly host cookie and exchanges the code through the backend; Google additionally uses PKCE. Sessions remain in the existing HttpOnly cookies. A 2FA response returns the user to the normal login verification UI, with their selected destination and remember-me preference retained. Provider cancellation, unavailable configuration, failed codes and expired state show an error on the login form.

Deploy the corresponding backend change before this frontend so that provider discovery and code exchange are available. See [backend setup](https://github.com/tr3ba/treba-backend/blob/main/docs/external-authentication.md) for provider configuration and consent settings.

Validation: `npm run build`, `node --test tests/*.test.mjs`. The external authentication integration tests run Next.js against a fixture API and cover both providers, state rejection, cancellation, 2FA, cookie privacy and safe redirects without contacting provider accounts.
