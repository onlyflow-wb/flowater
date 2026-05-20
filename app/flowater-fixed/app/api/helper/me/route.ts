/**
 * GET /api/helper/me
 * Returns the authenticated helper's identity from the JWT.
 * Used by the helper page to get display info without hitting the DB.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/session'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await verifySession(token)
  if (!session || session.role !== 'helper') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    id:           session.id,
    username:     session.username,
    display_name: session.display_name,
  })
}
