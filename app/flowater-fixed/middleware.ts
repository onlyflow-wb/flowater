/**
 * middleware.ts
 * Verifies the signed JWT session cookie on every protected route.
 * Runs on Vercel Edge — uses `jose` (Edge-compatible) for JWT verification.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      console.log('[middleware] No session cookie found')
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const session = await verifySession(token)
    if (!session || session.role !== 'admin') {
      console.log('[middleware] Session invalid or wrong role:', session)
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname.startsWith('/helper') && !pathname.startsWith('/helper/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const session = token ? await verifySession(token) : null

    if (!session || session.role !== 'helper') {
      const loginUrl = new URL('/helper/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/helper', '/helper/:path*'],
}
