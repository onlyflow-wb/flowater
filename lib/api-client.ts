import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=') ?? null
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = init.method?.toUpperCase() ?? 'GET'
  const headers = new Headers(init.headers)

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCookie(CSRF_COOKIE_NAME)
    if (csrfToken) headers.set(CSRF_HEADER_NAME, decodeURIComponent(csrfToken))
  }

  return fetch(input, {
    ...init,
    headers,
  })
}

export async function readApiError(response: Response, fallback = 'Request failed') {
  const body = await response.json().catch(() => null)
  return typeof body?.error === 'string' ? body.error : fallback
}
