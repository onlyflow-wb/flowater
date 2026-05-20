import { NextRequest, NextResponse } from 'next/server'
import { requireHelper } from '@/lib/auth-guard'
import { csrfError, hasValidCsrf } from '@/lib/csrf'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { z } from 'zod'

function adminClient() {
  return createSupabaseAdminClient()
}

const respondentCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  age: z.number().int().min(0).max(120),
  gender: z.string().trim().min(1).max(50),
  location: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(50).nullable().optional(),
  survey_type: z.enum(['helper', 'b2b']),
  session_id: z.string().uuid(),
})

const respondentUpdateSchema = respondentCreateSchema.pick({
  name: true,
  age: true,
  gender: true,
  location: true,
  phone: true,
}).partial().extend({
  id: z.string().uuid(),
})

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

export async function POST(request: NextRequest) {
  const helper = await requireHelper(request)
  if (!helper) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasValidCsrf(request)) return csrfError()

  const parsed = respondentCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  try {
    const supabase = adminClient()
    const { error } = await supabase.from('respondents').insert({
      ...parsed.data,
      helper_id: helper.id,
    })
    if (error) return NextResponse.json({ error: 'Failed to save respondent' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const helper = await requireHelper(request)
  if (!helper) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasValidCsrf(request)) return csrfError()

  const parsed = respondentUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { id, ...payload } = parsed.data

  try {
    const supabase = adminClient()
    const { data: respondent, error: fetchErr } = await supabase
      .from('respondents')
      .select('id, helper_id')
      .eq('id', id)
      .single()

    if (fetchErr || !respondent) return NextResponse.json({ error: 'Respondent not found' }, { status: 404 })
    if (respondent.helper_id !== helper.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase.from('respondents').update(payload).eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to update respondent' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/helper/respondents?id=xxx&session_id=xxx
// helper_id is taken from the JWT — not trusted from the client.
export async function DELETE(request: NextRequest) {
  const helper = await requireHelper(request)
  if (!helper) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasValidCsrf(request)) return csrfError()

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
