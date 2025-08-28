import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// GET all movie lists with movies and vote totals
export async function GET() {
  const lists = await prisma.movieList.findMany({
    include: {
      movies: true,
      votes: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
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

export async function POST(req: NextRequest) {
  const { title, movies, createdBy } = (await req.json()) as {
    title: string
    createdBy: string
    movies: IncomingMovie[]
  }

  if (!title || !createdBy || !Array.isArray(movies) || movies.length === 0) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  // de-dupe by tmdbId (client safety)
  const seen = new Set<number>()
  const uniqueMovies = movies.filter((m) => {
    const id = Number(m.tmdbId)
    if (!Number.isFinite(id) || seen.has(id)) return false
    seen.add(id)
    return true
  })

  const moviesToCreate = uniqueMovies.map((m: any) => {
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

    // Only include genres if it's an array; otherwise omit the field
    return Array.isArray(m.genres) ? { ...base, genres: m.genres } : base
  })

  try {
    const list = await prisma.movieList.create({
      data: {
        title,
        createdBy,
        movies: { create: moviesToCreate },
      },
      include: {
        movies: true,
        votes: true,
      },
    })

    return NextResponse.json(list, { status: 201 })
  } catch (err) {
    // Optional: surface Prisma unique constraint errors nicely
    // @ts-ignore
    const code = err?.code
    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate movie in this list (tmdbId must be unique per list).' },
        { status: 409 }
      )
    }
    console.error('Create list failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
