# FIXEND Cloudflare D1

1. Create a D1 database.
2. Run `migrations/0001_initial.sql` in the D1 SQL console.
3. In your Pages project: Settings → Bindings → Add D1 database binding.
4. Set the binding variable name to exactly `DB`.
5. Select your database and redeploy.

The `/functions` folder provides `/api/problems`, `/api/answers`, and `/api/votes`.
For a public launch, add real authentication and rate limiting/anti-spam.
