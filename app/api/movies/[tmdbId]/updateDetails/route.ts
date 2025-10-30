import { NextRequest, NextResponse } from 'next/server'
import { saveMovieDetails } from '../../../../../lib/tmdb'

export async function POST(req: NextRequest, { params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId: tmdbIdParam } = await params
  const tmdbId = Number(tmdbIdParam)
  await saveMovieDetails(tmdbId)
  return NextResponse.json({ ok: true })
}
