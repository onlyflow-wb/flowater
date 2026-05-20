import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { csrfError, hasValidCsrf } from '@/lib/csrf'
import { questionSchema, questionUpdateSchema } from '@/validators/questions'

async function guardAdminMutation(request: NextRequest) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasValidCsrf(request)) return csrfError()
  return null
}

export async function GET(request: NextRequest) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const surveyType = request.nextUrl.searchParams.get('survey_type')
  if (surveyType !== 'public' && surveyType !== 'b2b') {
    return NextResponse.json({ error: 'Invalid survey type' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_type', surveyType)
      .order('order_index', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
    return NextResponse.json({ questions: data ?? [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guarded = await guardAdminMutation(request)
  if (guarded) return guarded

  const body = await request.json().catch(() => null)
  const parsed = questionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase.from('questions').insert(parsed.data).select().single()
    if (error) return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const guarded = await guardAdminMutation(request)
  if (guarded) return guarded

  const body = await request.json().catch(() => null)
  const parsed = questionUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const { id, ...payload } = parsed.data

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('questions').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const guarded = await guardAdminMutation(request)
  if (guarded) return guarded

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const guarded = await guardAdminMutation(request)
  if (guarded) return guarded

  const body = await request.json().catch(() => null)
  const parsed = questionUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const { id, ...payload } = parsed.data

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('questions').update(payload).eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
