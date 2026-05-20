# FloWater V3 — Security Fixes Applied

## What was fixed

### 🔴 Critical → Fixed

| Issue | Fix Applied |
|---|---|
| Admin credentials in `NEXT_PUBLIC_*` vars (visible in browser JS bundle) | Moved to server-only `ADMIN_USER` / `ADMIN_PASS` env vars. Admin login now hits `/api/admin/login` server-side. |
| `admin_auth=true` cookie forgeable by anyone in DevTools | Replaced with signed **HMAC-HS256 JWT** (`fw_session`) that cannot be forged without the `SESSION_SECRET`. |
| Helper auth checked by direct Supabase query from browser (exposes schema) | Moved to `/api/helper/login` — bcrypt comparison server-side only. |
| `helper_id` trusted from client query params (spoofable) | `helper_id` now extracted from the verified JWT on the server. Client cannot fake it. |
| Passwords stored as plaintext in DB | bcrypt (cost 12) on every new create/update. Legacy plaintext passwords are **auto-upgraded** to bcrypt on next login. |
| `.env.local` with real credentials inside the ZIP | Replaced with a placeholder template. Add `.env.local` to `.gitignore`. |

### 🟡 Auth → Fixed

| Issue | Fix Applied |
|---|---|
| No rate limiting on login | 10 attempts / 15 min per IP on both `/api/admin/login` and `/api/helper/login`. |
| No HttpOnly cookie | `fw_session` is set `HttpOnly; SameSite=Strict` (and `Secure` in production). JS cannot read it. |
| Middleware trusts plain cookie value | Middleware now calls `jwtVerify()` from `jose` — invalid/expired/tampered tokens are rejected. |
| Internal error messages exposed in API responses | API routes now return generic error strings, not raw DB error messages. |

### 🟡 Input validation → Fixed

| Issue | Fix Applied |
|---|---|
| No schema validation on API payloads | Zod validation added to login routes and helper create/update. |

## Required setup steps

### 1. Generate a session secret
```bash
openssl rand -base64 32
```
Paste the output as `SESSION_SECRET` in your `.env.local`.

### 2. Remove `NEXT_PUBLIC_ADMIN_*` from your environment
Delete any `NEXT_PUBLIC_ADMIN_USER` and `NEXT_PUBLIC_ADMIN_PASS` vars from Vercel / your host.
Add `ADMIN_USER` and `ADMIN_PASS` as **server-only** (non-public) environment variables.

### 3. Run the SQL column-level security commands in Supabase
```sql
REVOKE SELECT (password) ON helpers FROM anon;
GRANT SELECT (id, username, display_name, is_active, created_at) ON helpers TO anon;
```

### 4. Rehash existing helper passwords
The app auto-upgrades plaintext passwords to bcrypt on the next login.  
Alternatively, use the admin Helpers panel to reset each helper's password.

## What remains (out of scope for this patch)

- **CSRF tokens** on state-mutating API routes (mitigated by `SameSite=Strict` cookie attribute)
- **Persistent sessions** (JWTs expire after 8 hours; no refresh token)
- **Production TLS** — enable `Secure` flag by setting `NODE_ENV=production`

