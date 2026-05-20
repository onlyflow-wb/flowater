import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { csrfError, hasValidCsrf } from '@/lib/csrf'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(1).max(128),
})

function adminClient() {
  return createSupabaseAdminClient()
}

// POST /api/admin/nuke — delete all responses, respondents, and questions (keeps helpers)
export async function POST(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasValidCsrf(request)) return csrfError()

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid confirmation password' }, { status: 400 })

  const nukePassword = process.env.ADMIN_NUKE_PASSWORD
  if (!nukePassword || parsed.data.password !== nukePassword) {
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
