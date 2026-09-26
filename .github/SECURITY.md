# Security Policy

## Supported versions

XK Trading Floor is a client project maintained by Stackified. Only the latest version on the `main`
branch (what is deployed to production) is maintained.

| Version | Supported |
|---------|:---------:|
| Latest (`main`) | Yes |
| Older commits | No |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Instead, use GitHub's private reporting:

1. Go to the [Security tab](https://github.com/stackified/xktradingfloor/security).
2. Click **Report a vulnerability**.
3. Describe the issue, steps to reproduce, and potential impact.

You can expect an acknowledgement within a few days. Thank you for helping keep the project safe.

## Notes on this project

XK Trading Floor is a full-stack application, so its attack surface is larger than a static site:

- **Backend:** an Express API (`backend/`) hosted on Render, backed by MongoDB through Mongoose.
- **Accounts and roles:** users sign up and log in with email and password. Passwords are hashed with
  bcrypt, sessions are JWTs sent as an HTTP-only cookie or a Bearer token, and a token version on the
  user record invalidates old sessions after a password change. Roles are `User`, `Operator` and
  `Admin`; the `/api/admin` routes require Operator or Admin.
- **User data:** profile details, reviews with optional screenshots, blog posts and comments, and
  verified-trader applications that include broker statements and payout proofs. Those proofs are
  uploaded to Cloudflare R2 by storage key only and shown to admins through one-hour presigned URLs;
  other uploads (blog images, company logos, review screenshots, avatars) are public.
- **Email:** transactional mail (welcome, password reset, login and security alerts, content
  notifications) and admin bulk campaigns are sent through Brevo. Forgot-password, reset-password and blog-comment endpoints are
  rate limited.
- **Third parties:** Cloudflare (DNS/CDN and R2), Brevo, Render, Bluehost (frontend hosting), Google
  Analytics / Tag Manager and AdSense on the client, and scheduled scraping of public spread data from
  Myfxbook.
- **Payments:** none. The merch cart is client-side only and has no checkout integration.
- **Secrets:** the backend reads its database URI, JWT secret and API keys from environment variables
  (see `backend/.env.example`). Deployment credentials live in GitHub Actions secrets. No secrets are
  committed, and `VITE_` variables in the frontend are public by design.

The JavaScript and TypeScript code is scanned by CodeQL on every push.
