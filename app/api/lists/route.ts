import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET movie lists not associated with a meetup,
// Sorted by number of votes (desc) then createdAt (asc)
export async function GET() {
  const lists = await prisma.movieList.findMany({
    where: {
      Meetup: null,
    },
    include: {
      movies: true,
      votes: true,
      _count: { select: { votes: true } },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Sort by votes desc, then createdAt asc
  lists.sort((a, b) => {
    const diff = b._count.votes - a._count.votes
    if (diff !== 0) return diff
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return NextResponse.json(lists)
}

type IncomingMovie = {
  tmdbId: number
  title: string
  originalTitle?: string | null
  originalLanguage?: string | null
  releaseDate?: string | null
  overview?: string | null
  voteAverage?: number | null
  voteCount?: number | null
  posterPath?: string | null
  backdropPath?: string | null
  genres?: number[] | null
}

export function normalizeMovies(movies: IncomingMovie[]) {
  const seen = new Set<number>()
  return movies
    .filter((m) => {
      const id = Number(m.tmdbId)
      if (!Number.isFinite(id) || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((m) => {
      const base = {
        tmdbId: Number(m.tmdbId),
        title: m.title,
        originalTitle: m.originalTitle ?? null,
        originalLanguage: m.originalLanguage ?? null,
        releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
        overview: m.overview ?? null,
        voteAverage: m.voteAverage ?? null,
        voteCount: m.voteCount ?? null,
        posterPath: m.posterPath ?? null,
        backdropPath: m.backdropPath ?? null,
      }
      return Array.isArray(m.genres) ? { ...base, genres: m.genres } : base
    })
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, createdBy, movies } = await req.json()
    const list = await prisma.movieList.create({
      data: {
        title,
        description,
        createdBy,
        movies: { create: normalizeMovies(movies) },
      },
      include: { movies: true, votes: true },
    })
    return NextResponse.json(list, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate movie' }, { status: 409 })
    }
    console.error('Create failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
