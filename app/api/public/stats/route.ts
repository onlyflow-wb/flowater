/**
 * GET /api/public/stats
 * Returns aggregate stats for the front page (no auth required).
 * Uses service-role key server-side so anon RLS restrictions don't apply.
 */
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

function adminClient() {
  try {
    return createSupabaseAdminClient()
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const supabase = adminClient()
    if (!supabase) return NextResponse.json({ voices: 0, cities: 0, acceptance: 0 })

    const { data: responses } = await supabase
      .from('responses')
      .select('session_id, answer_value')

    if (!responses) return NextResponse.json({ voices: 0, cities: 0, acceptance: 0 })

    const uniqueSessions = new Set(responses.map(r => r.session_id)).size
    const citySet = new Set<string>()
    responses.forEach(r => {
      const v = r.answer_value?.trim()
      if (v && v.length > 2 && v.length < 40 && isNaN(Number(v)) && v !== 'yes' && v !== 'no') {
        citySet.add(v.toLowerCase())
      }
    })
    const yesCount = responses.filter(r => r.answer_value === 'yes').length
    const noCount  = responses.filter(r => r.answer_value === 'no').length
    const total    = yesCount + noCount
    const acceptance = total > 0 ? Math.round((yesCount / total) * 100) : 0

    return NextResponse.json({
      voices:     uniqueSessions,
      cities:     Math.max(1, Math.min(citySet.size, uniqueSessions)),
      acceptance,
    })
  } catch {
    return NextResponse.json({ voices: 0, cities: 0, acceptance: 0 })
  }
}
