/**
 * lib/session.ts
 * Signed JWT session helpers — works in both Edge (middleware) and Node runtimes.
 * Uses `jose` which is Edge-compatible.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export type SessionRole = 'admin' | 'helper'

export interface AdminPayload extends JWTPayload {
  role: 'admin'
}

export interface HelperPayload extends JWTPayload {
  role: 'helper'
  id: string
  username: string
  display_name: string
}

export type SessionPayload = AdminPayload | HelperPayload

const COOKIE_NAME = 'fw_session'
const EXPIRY      = '8h'            // sessions expire after 8 hours of inactivity

function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET
  if (!raw || raw.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET env var is missing or too short (min 32 chars)')
    }
    // Dev-only fallback so the app works without manual setup.
    // Set SESSION_SECRET in .env.local before deploying.
    console.warn('[flowater] SESSION_SECRET not set — using insecure dev fallback!')
    return new TextEncoder().encode('dev-only-secret-do-not-use-in-production-!!')
  }
  return new TextEncoder().encode(raw)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as SessionPayload
  } catch {
    return null
  }
}

export { COOKIE_NAME }
