import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireHelper } from '@/lib/auth-guard'
import { csrfError, hasValidCsrf } from '@/lib/csrf'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

function adminClient() {
  return createSupabaseAdminClient()
}

const schema = z.object({
  current_password: z.string().min(1),
  new_password:     z.string().min(4, 'Password must be at least 4 characters'),
})

export async function POST(request: NextRequest) {
  const helper = await requireHelper(request)
  if (!helper) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasValidCsrf(request)) return csrfError()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { current_password, new_password } = parsed.data

  const supabase = adminClient()
  const { data: row } = await supabase
    .from('helpers')
    .select('password')
    .eq('id', helper.id)
    .single()

  if (!row) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const isBcrypt = row.password.startsWith('$2')
  const valid = isBcrypt
    ? await bcrypt.compare(current_password, row.password)
    : current_password === row.password

  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

  const hashed = await bcrypt.hash(new_password, 12)
  const { error } = await supabase.from('helpers').update({ password: hashed }).eq('id', helper.id)
  if (error) return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
