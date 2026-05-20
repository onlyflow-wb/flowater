import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { csrfError, hasValidCsrf } from '@/lib/csrf'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

function adminClient() {
  return createSupabaseAdminClient()
}



// GET /api/admin/data — fetch all respondents with their answers
export async function GET(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = adminClient()

    const [{ data: respondents, error: rErr }, { data: responses, error: resErr }, { data: questions, error: qErr }] =
      await Promise.all([
        supabase.from('respondents').select('*').order('created_at', { ascending: false }),
        supabase.from('responses').select('*'),
        supabase.from('questions').select('id, title, survey_type'),
      ])

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })
    if (resErr) return NextResponse.json({ error: resErr.message }, { status: 500 })
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

    return NextResponse.json({ respondents: respondents ?? [], responses: responses ?? [], questions: questions ?? [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/admin/data?type=respondent&id=xxx  — delete a respondent + their responses
export async function DELETE(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasValidCsrf(request)) return csrfError()

  const id = request.nextUrl.searchParams.get('id')
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const supabase = adminClient()

    // Delete their responses first (FK constraint)
    if (sessionId) {
      await supabase.from('responses').delete().eq('session_id', sessionId)
    }
    const { error } = await supabase.from('respondents').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
