# Mobile identity bridge (M2.2)

Auth.js/MySQL remains the identity authority. The separate RoboEQ Parent service owns account links, families and mobile sessions. No Prisma schema or commerce permission changes are required. A website ADMIN does not acquire Parent administrator rights.

The bridge is disabled by default (`MOBILE_BRIDGE_ENABLED=false`). To enable it in an isolated test environment, configure an explicit HTTPS identity origin, Parent HTTPS origin, RSA >=2048-bit PKCS8 private-key file, key ID and independent random server status credential (>=32 random bytes encoded as base64url). Parent must pin the matching public key and the exact issuer. Keep private keys/credentials outside Git and `NEXT_PUBLIC_*`; production activation is a separate operation.

- `GET /mobile/authorize`: exact registered client `roboeq-mobile`, redirect `roboeq://auth/callback`, `response_type=code`, PKCE S256 (43-character challenge), 22–256-character unreserved state. Optional scope is restricted to `parent:read parent:write`; actual authorization comes from Parent family membership/grants.
- Login preserves only a validated internal `/mobile/authorize?...` return. Password, OTP and configured social providers reuse existing authentication; no additional authentication endpoint bypasses it.
- The route reads the current MySQL User through `requireUser`, signs an RS256 `roboeq-identity+jwt` assertion (60 seconds, audience `roboeq-parent`) bound to client/redirect/challenge/method/state and posts it to the fixed Parent origin. The callback contains only a one-time opaque code and original state.
- `POST /api/mobile/identity-status`: independent server bearer credential, exact User ID and fresh random nonce. Reads current `deletedAt`, returns a nonce-bound RS256 `roboeq-status+jwt` assertion (30 seconds). It never accepts commerce role as Parent authority. There is currently no separate website lock flag; adding one later requires including it in this query.

The shared request hash is SHA256 of UTF-8 compact JSON `[client_id,redirect_uri,code_challenge,code_challenge_method,state]`. Assertion headers are exactly `alg=RS256`, the protocol-specific `typ`, and a pinned `kid`. Parent verifies issuer, audience, strict claim types, expiry, signature and request binding; never accepts a mobile-supplied User ID.

`npm run test:mobile` runs the cryptographic/return/configuration boundary tests. Standard quality CI also runs lint, TypeScript, migration checks, build and browser regressions using dedicated MySQL/Redis services. The private backend's separate combined CI pins this website source SHA and exercises real Auth.js login, both servers, HTTPS and real MySQL/PostgreSQL. Passing unit tests alone is not that proof, and does not complete Android/iOS or live Google/Facebook acceptance.

No production environment, signing key, deployment, or schema is changed by this source branch. Website `main` triggers Docker publication, so review this feature branch before any production integration.
