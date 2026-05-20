import { NextRequest, NextResponse } from 'next/server'

export const CSRF_COOKIE_NAME = 'fw_csrf'
export const CSRF_HEADER_NAME = 'x-csrf-token'

export function createCsrfToken(): string {
  return crypto.randomUUID()
}

export function setCsrfCookie(response: NextResponse, token: string) {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60,
  })
}

export function clearCsrfCookie(response: NextResponse) {
  response.cookies.set(CSRF_COOKIE_NAME, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}

export function hasValidCsrf(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  return Boolean(cookieToken && headerToken && cookieToken === headerToken)
}

export function csrfError() {
  return NextResponse.json({ error: 'Invalid security token. Refresh the page and try again.' }, { status: 403 })
}
