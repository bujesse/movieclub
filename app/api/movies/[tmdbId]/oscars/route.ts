import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../../lib/cfAccess'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tmdbId: tmdbIdParam } = await params
  const tmdbId = Number(tmdbIdParam)

  if (isNaN(tmdbId)) {
    return NextResponse.json({ error: 'Invalid TMDB ID' }, { status: 400 })
  }

  const [nominations, movie] = await Promise.all([
    prisma.oscarNomination.findMany({
      where: { tmdbId },
      select: {
        ceremony: true,
        year: true,
        class: true,
        category: true,
        canonicalCategory: true,
        name: true,
        winner: true,
        detail: true,
      },
      orderBy: [
        { ceremony: 'asc' },
        { winner: 'desc' }, // Winners first within each ceremony
      ],
    }),
    prisma.globalMovie.findFirst({
      where: { tmdbId },
      select: {
        releaseDate: true,
        runtime: true,
        directors: true,
        actors: true,
        genres: true,
        originalLanguage: true,
        voteAverage: true,
        voteCount: true,
      },
    }),
  ])

  return NextResponse.json({
    nominations,
    releaseDate: movie?.releaseDate ?? null,
    runtime: movie?.runtime ?? null,
    directors: movie?.directors ?? null,
    actors: movie?.actors ?? null,
    genres: movie?.genres ?? null,
    originalLanguage: movie?.originalLanguage ?? null,
    voteAverage: movie?.voteAverage ?? null,
    voteCount: movie?.voteCount ?? null,
  })
}
