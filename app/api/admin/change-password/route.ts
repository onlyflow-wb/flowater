import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Admin password changes are managed through Vercel environment variables.' },
    { status: 501 },
  )
}
