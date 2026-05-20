import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth-guard'

const NUKE_PASSWORD = 'j130448416'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST /api/admin/nuke — delete all responses, respondents, and questions (keeps helpers)
export async function POST(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { password?: string } = {}
  try { body = await request.json() } catch { /* empty body */ }

  if (body.password !== NUKE_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 403 })
  }

  try {
    const supabase = adminClient()

    // Delete in FK-safe order: responses → respondents → questions
    const { error: resErr } = await supabase.from('responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (resErr) return NextResponse.json({ error: `responses: ${resErr.message}` }, { status: 500 })

    const { error: rErr } = await supabase.from('respondents').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (rErr) return NextResponse.json({ error: `respondents: ${rErr.message}` }, { status: 500 })

    const { error: qErr } = await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (qErr) return NextResponse.json({ error: `questions: ${qErr.message}` }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
