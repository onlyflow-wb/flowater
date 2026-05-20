import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/session'
import { clearCsrfCookie } from '@/lib/csrf'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path:     '/',
    maxAge:   0,
  })
  clearCsrfCookie(res)
  return res
}
