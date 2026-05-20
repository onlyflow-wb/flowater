# Vercel Deployment

## Required Environment Variables

Set these in Vercel Project Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USER`
- `ADMIN_PASS` or `ADMIN_PASS_HASH`
- `ADMIN_NUKE_PASSWORD`
- `SESSION_SECRET`

`SESSION_SECRET` must be at least 32 characters. Use different values for `ADMIN_PASS` and `ADMIN_NUKE_PASSWORD`.

## Supabase

Run `SUPABASE_MIGRATION.sql` in your Supabase SQL editor before deploying. Keep Row Level Security enabled. The app uses the service-role key only inside server routes.

## Vercel Settings

- Framework Preset: Next.js
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave empty

## Admin Password Changes

On Vercel, admin credentials are environment-managed. To rotate the admin password, update `ADMIN_PASS` or `ADMIN_PASS_HASH` in Vercel and redeploy.
