import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { responsesSchema } from '@/validators/survey'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = checkRateLimit(`public-responses:${ip}`, { maxAttempts: 30, windowMs: 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Too many submissions. Please wait a moment.' }, { status: 429 })

  const parsed = responsesSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  if (parsed.data.responses.length === 0) return NextResponse.json({ ok: true })

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('responses').insert(parsed.data.responses)
    if (error) return NextResponse.json({ error: 'Failed to save responses' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
