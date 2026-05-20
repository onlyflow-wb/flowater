import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-guard'
import { csrfError, hasValidCsrf } from '@/lib/csrf'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

const helperSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  password: z.string().min(4).max(128),
  display_name: z.string().trim().min(1).max(100),
  is_active: z.boolean().optional().default(true),
})

const helperUpdateSchema = helperSchema.partial().extend({
  id: z.string().uuid(),
})

async function guardAdminMutation(request: NextRequest) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasValidCsrf(request)) return csrfError()
  return null
}

export async function GET(request: NextRequest) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('helpers')
      .select('id, username, display_name, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to load helpers' }, { status: 500 })
    return NextResponse.json({ helpers: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guarded = await guardAdminMutation(request)
  if (guarded) return guarded

  const body = await request.json().catch(() => null)
  const parsed = helperSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { password, ...rest } = parsed.data
  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('helpers')
      .insert({ ...rest, password: hashedPassword })
      .select('id, username, display_name, is_active, created_at')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create helper' }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const guarded = await guardAdminMutation(request)
  if (guarded) return guarded

  const body = await request.json().catch(() => null)
  const parsed = helperUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { id, password, ...rest } = parsed.data
  const update: Record<string, unknown> = { ...rest }

  if (password) {
    update.password = await bcrypt.hash(password, 12)
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('helpers').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to update helper' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const guarded = await guardAdminMutation(request)
  if (guarded) return guarded

  const parsed = z.object({
    id: z.string().uuid(),
    is_active: z.boolean(),
  }).safeParse(await request.json().catch(() => null))

  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('helpers')
      .update({ is_active: parsed.data.is_active })
      .eq('id', parsed.data.id)

    if (error) return NextResponse.json({ error: 'Failed to update helper status' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const guarded = await guardAdminMutation(request)
  if (guarded) return guarded

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('helpers').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to delete helper' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
