import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-guard'
import { verifyAdminCredentials, updateAdminPassword } from '@/lib/admin-auth'

const schema = z.object({
  current_password: z.string().min(1),
  new_password:     z.string().min(4, 'Password must be at least 4 characters'),
})

export async function POST(request: NextRequest) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { current_password, new_password } = parsed.data
  const adminUser = process.env.ADMIN_USER ?? 'admin'

  const valid = await verifyAdminCredentials(adminUser, current_password)

  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  await updateAdminPassword(adminUser, new_password)

  return NextResponse.json({ ok: true })
}
