/**
 * lib/auth-guard.ts
 * Server-side JWT verification for API routes.
 * Use these helpers instead of checking cookie === 'true'.
 */
import { NextRequest } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/session'

export async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  const session = await verifySession(token)
  return session?.role === 'admin'
}

export async function requireHelper(request: NextRequest): Promise<{ id: string; username: string; display_name: string } | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const session = await verifySession(token)
  if (!session || session.role !== 'helper') return null
  return { id: session.id, username: session.username, display_name: session.display_name }
}
