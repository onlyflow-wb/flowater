import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { respondentSchema } from '@/validators/survey'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed } = checkRateLimit(`public-respondent:${ip}`, { maxAttempts: 30, windowMs: 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Too many submissions. Please wait a moment.' }, { status: 429 })

  const parsed = respondentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('respondents').insert(parsed.data)
    if (error) return NextResponse.json({ error: 'Failed to save respondent' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
