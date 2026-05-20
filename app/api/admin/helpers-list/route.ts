import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

function adminClient() {
  return createSupabaseAdminClient()
}



// GET /api/admin/helpers-list — lightweight list of helpers (id, display_name, username)
export async function GET(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = adminClient()
    const { data, error } = await supabase
      .from('helpers')
      .select('id, display_name, username')
      .order('display_name', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ helpers: data ?? [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
