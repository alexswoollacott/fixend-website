# FIXEND + Cloudflare D1

FIXEND is a Cloudflare Pages app backed by D1. Problems, answers and votes are stored in D1; the UI calls Pages Functions under `/api/*`.

## 1. Install dependencies

```bash
npm install
npx wrangler login
```

## 2. Create the D1 database

```bash
npx wrangler d1 create fixend-db
```

Cloudflare will print a `database_id`. Paste that value into `wrangler.jsonc` in place of `PASTE_YOUR_D1_DATABASE_ID_HERE`.

If this Pages project already has configuration in the Cloudflare dashboard, Cloudflare recommends downloading it first with `npx wrangler pages download config <PROJECT_NAME>` and then adding the `DB` D1 binding rather than blindly replacing existing project settings.

## 3. Create the tables

For your production D1 database:

```bash
npm run db:remote
```

For local development:

```bash
npm run db:local
```

## 4. Run locally

```bash
npm run dev
```

Wrangler will serve `public/` and run the Pages Functions. Local D1 data is persisted locally by Wrangler.

## 5. Deploy

If your Pages project uses Git integration, commit these files to the repository and push. Because `wrangler.jsonc` has `pages_build_output_dir`, it becomes the Pages configuration source of truth.

You can also deploy from the CLI:

```bash
npm run deploy
```

### Dashboard-binding alternative

Instead of keeping the D1 ID in `wrangler.jsonc`, you can bind D1 in Cloudflare Dashboard > Workers & Pages > your Pages project > Settings > Bindings, with variable name `DB`. Redeploy after adding the binding. Do not configure the same setting in two places without understanding which configuration is authoritative.

## API routes

- `GET /api/problems?q=&filter=latest|popular|unanswered`
- `POST /api/problems`
- `POST /api/problems/:id/answers`
- `POST /api/answers/:id/vote`
- `GET /api/leaderboard`

## Current identity model

This starter does not yet have login accounts. It stores a random voter key in each browser's localStorage and uses a database uniqueness constraint so that browser has one current vote per answer. This is useful for a first public prototype, but it is not strong anti-abuse security. For production trust scores, add real authentication and store votes against authenticated user IDs.
