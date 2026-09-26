# Contributing to XK Trading Floor

XK Trading Floor is a client project. The code is owned by XK Trading Floor and is designed, built
and maintained by the [Stackified](https://github.com/stackified) team. The repository is public for
portfolio purposes, so outside pull requests are not part of the normal workflow. Bug reports through
[issues](https://github.com/stackified/xktradingfloor/issues) are welcome, and security problems should
be reported privately (see [SECURITY.md](SECURITY.md)).

The notes below are for members of the Stackified team working on the project.

## Getting set up

The repository has two independent npm projects: `frontend/` (React + Vite) and `backend/`
(Express + MongoDB). There is no root `package.json`.

Requirements: Node.js 22 (the CI version; Vite 7 needs 20.19 or newer) and a MongoDB database
(local or Atlas).

1. Clone the repository and install each project:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Create the environment files from the committed templates and fill in real values:
   - `backend/.env.example` -> `backend/.env` (MongoDB URI, JWT secret, Brevo, Cloudflare R2)
   - `frontend/.env.example` -> `frontend/.env`
3. Start the API (listens on `PORT`, `8000` in the template):
   ```bash
   cd backend
   npm run dev      # nodemon
   # or: npm start
   ```
4. Start the frontend dev server on `http://localhost:5173`:
   ```bash
   cd frontend
   npm run dev
   ```
   In development the Vite server proxies `/api`, `/images` and `/uploads` to
   `VITE_BACKEND_URL` (default `http://localhost:8000`).

## Useful commands (frontend)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Sitemap + Vite build into `frontend/docs/` |
| `npm run build:prod` | Production build with base `/`, homepage/blog prerender and hydration check |
| `npm run build:gith` | Same pipeline with base `/xktradingfloor/` (GitHub Pages staging) |
| `npm run preview` | Serve the last build on port 5173 |
| `npx playwright test` | End-to-end tests in `frontend/tests/e2e/` (starts `npm run dev` if needed) |

The prerender scripts use `puppeteer-core` and need a local Chrome (or `CHROME_PATH`). If Chrome is
missing the prerender step is skipped and the build still completes.

## Project structure

- `frontend/src/pages/` - route pages (home, events, blog, reviews, live spreads, dashboards, admin and operator pages)
- `frontend/src/components/` - UI grouped by area (`home/`, `reviews/`, `blog/`, `admin/`, `academy/`, `merch/`, `shared/`)
- `frontend/src/controllers/` - API client (`api.js`) and one controller per resource, plus `responseCache.js`
- `frontend/src/redux/` - Redux Toolkit store and slices (auth, blogs, cart, mock mode, analytics)
- `frontend/src/models/` - local JSON and JS data used for mock mode and static sections
- `frontend/scripts/` - sitemap, prerender and hydration-check scripts used by the build
- `backend/routes/api/` - `auth`, `public/`, `protected/`, `admin/` and `marketing` routers
- `backend/controllers/`, `backend/models/` - Express handlers and Mongoose models
- `backend/services/` - Brevo email, bulk marketing, Myfxbook spread scraper
- `backend/helpers/r2.helper.js` - Cloudflare R2 uploads and presigned URLs
- `backend/emails/templates/` - EJS email templates

## Branches and deployment

- `main` is production. Every push runs `.github/workflows/deploy.yml`, which builds the frontend with
  `npm run build:prod` and uploads `frontend/docs/` to Bluehost over FTP (the site is served at
  `xktradingfloor.com` behind Cloudflare).
- `dev` is staging. Every push runs `.github/workflows/deploy-staging.yml`, which builds with
  `npm run build:gith` and publishes to the `gh-pages` branch
  ([stackified.github.io/xktradingfloor](https://stackified.github.io/xktradingfloor/)).
- The backend is not deployed by GitHub Actions. It runs on Render
  (`xktradingfloor-backend.onrender.com`), and `.github/workflows/keep-backend-warm.yml` pings it every
  10 minutes so the free instance does not sleep.

Work on a feature branch cut from `dev`, for example `feat/fe-short-description` or `fix/short-description`.

## Making changes

1. Keep changes focused. One feature or fix per pull request.
2. Match the existing style: React function components, Tailwind classes, API calls through
   `frontend/src/controllers/`, and CommonJS modules in the backend.
3. Never commit `.env` files. Anything prefixed `VITE_` is bundled into the public client, so it must
   not hold secrets.
4. Run `npm run build:prod` in `frontend/` before opening a pull request, and exercise the pages and
   API routes you touched against a local backend.

## Pull requests

1. Push your branch and open a pull request against `dev`. `dev` is merged into `main` to release.
2. Fill in the pull request template: what changed, why, and how you tested it.
3. Link any related issue (for example, `Closes #12`).

For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
