/**
 * POST /api/helper/login
 * Validates helper credentials against the DB (bcrypt-aware).
 * On success, sets a signed HttpOnly JWT session cookie containing helper identity.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signSession, COOKIE_NAME } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = checkRateLimit(`helper-login:${ip}`, { maxAttempts: 10, windowMs: 15 * 60 * 1000 })
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

  try {
    const supabase = adminClient()
    const { data: helper, error } = await supabase
      .from('helpers')
      .select('id, username, password, display_name, is_active')
      .eq('username', username.trim().toLowerCase())
      .eq('is_active', true)
      .single()

    if (error || !helper) {
      await new Promise(r => setTimeout(r, 300)) // prevent timing attacks
      return NextResponse.json({ error: 'Invalid credentials or account inactive' }, { status: 401 })
    }

    // Support both bcrypt hashes and legacy plaintext (auto-upgrades on login)
    const storedPw: string = helper.password
    const isBcrypt = storedPw.startsWith('$2b$') || storedPw.startsWith('$2a$')
    let valid = false

    if (isBcrypt) {
      valid = await bcrypt.compare(password, storedPw)
    } else {
      // Legacy plaintext — compare and immediately upgrade
      valid = password === storedPw
      if (valid) {
        const hashed = await bcrypt.hash(password, 12)
        await supabase.from('helpers').update({ password: hashed }).eq('id', helper.id)
      }
    }

    if (!valid) {
      await new Promise(r => setTimeout(r, 300))
      return NextResponse.json({ error: 'Invalid credentials or account inactive' }, { status: 401 })
    }

    const token = await signSession({
      role:         'helper',
      id:           helper.id,
      username:     helper.username,
      display_name: helper.display_name,
    })

    const res = NextResponse.json({
      ok:           true,
      display_name: helper.display_name,
      username:     helper.username,
      id:           helper.id,
    })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path:     '/',
      maxAge:   8 * 60 * 60,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
