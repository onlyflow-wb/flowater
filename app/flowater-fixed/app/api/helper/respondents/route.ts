import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireHelper } from '@/lib/auth-guard'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

// GET /api/helper/respondents
// Returns today's respondents for the authenticated helper (id from JWT, not query param).
export async function GET(request: NextRequest) {
  const helper = await requireHelper(request)
  if (!helper) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = adminClient()
    const day = new Date()
    day.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('respondents')
      .select('*')
      .eq('helper_id', helper.id)
      .gte('created_at', day.toISOString())
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to load respondents' }, { status: 500 })
    return NextResponse.json({ respondents: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/helper/respondents?id=xxx&session_id=xxx
// helper_id is taken from the JWT — not trusted from the client.
export async function DELETE(request: NextRequest) {
  const helper = await requireHelper(request)
  if (!helper) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id        = request.nextUrl.searchParams.get('id')
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const supabase = adminClient()

    const { data: respondent, error: fetchErr } = await supabase
      .from('respondents')
      .select('id, helper_id')
      .eq('id', id)
      .single()

    if (fetchErr || !respondent) {
      return NextResponse.json({ error: 'Respondent not found' }, { status: 404 })
    }

    // Use helper.id from JWT — client cannot spoof this
    if (respondent.helper_id !== helper.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (sessionId) {
      await supabase.from('responses').delete().eq('session_id', sessionId)
    }
    const { error } = await supabase.from('respondents').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
