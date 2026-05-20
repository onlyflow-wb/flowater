/**
 * POST /api/admin/login
 * Verifies admin credentials server-side (never exposed to browser).
 * On success, sets a signed HttpOnly JWT session cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { signSession, COOKIE_NAME } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'
import { verifyAdminCredentials } from '@/lib/admin-auth'
import { createCsrfToken, setCsrfCookie } from '@/lib/csrf'

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
})

export async function POST(request: NextRequest) {
  // Rate-limit by IP: 10 attempts per 15 minutes
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = checkRateLimit(`admin-login:${ip}`, { maxAttempts: 10, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait.' }, { status: 429 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { username, password } = parsed.data

  const valid = await verifyAdminCredentials(username, password)
  if (!valid) {
    // Constant-time-ish: always wait a bit to prevent timing attacks
    await new Promise(r => setTimeout(r, 300))
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signSession({ role: 'admin' })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path:     '/',
    maxAge:   8 * 60 * 60,   // 8 hours in seconds
  })
  setCsrfCookie(res, createCsrfToken())
  return res
}
