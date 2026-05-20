import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-guard'

// Server-side admin client — uses the service-role key so it bypasses RLS.
// SUPABASE_SERVICE_ROLE_KEY is never prefixed with NEXT_PUBLIC_ and is
// therefore never sent to the browser.
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

// Guard: reject requests that don't have the admin cookie


// PATCH /api/admin/helpers  — toggle is_active
export async function PATCH(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, is_active } = body

  if (!id || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  try {
    const supabase = adminClient()
    const { error } = await supabase
      .from('helpers')
      .update({ is_active })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/admin/helpers?id=<uuid>
export async function DELETE(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  try {
    const supabase = adminClient()
    const { error } = await supabase.from('helpers').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

const helperSchema = z.object({
  username:     z.string().min(1).max(64),
  password:     z.string().min(4).max(128),
  display_name: z.string().min(1).max(100),
  is_active:    z.boolean().optional().default(true),
})

// POST /api/admin/helpers  — create helper
export async function POST(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const parsed = helperSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { password, ...rest } = parsed.data
  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    const supabase = adminClient()
    const { data, error } = await supabase
      .from('helpers')
      .insert({ ...rest, password: hashedPassword })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create helper' }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT /api/admin/helpers  — update helper (edit modal)
export async function PUT(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { id, password, ...rest } = body as Record<string, unknown>
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const update: Record<string, unknown> = { ...rest }

  // Only re-hash if a new password was supplied
  if (password && typeof password === 'string' && password.length >= 4) {
    update.password = await bcrypt.hash(password, 12)
  }

  try {
    const supabase = adminClient()
    const { error } = await supabase.from('helpers').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
