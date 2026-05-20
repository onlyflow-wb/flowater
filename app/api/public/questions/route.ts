import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { surveyTypeSchema } from '@/validators/survey'

export async function GET(request: NextRequest) {
  const parsed = surveyTypeSchema.safeParse(request.nextUrl.searchParams.get('survey_type'))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid survey type' }, { status: 400 })

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_type', parsed.data)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to load survey questions' }, { status: 500 })
    return NextResponse.json({ questions: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
