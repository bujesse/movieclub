import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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

  // Calculate total votes per list
  const result = lists.map((list) => ({
    id: list.id,
    title: list.title,
    createdBy: list.createdBy,
    movies: list.movies,
    totalVotes: list.votes.reduce((sum, v) => sum + v.value, 0),
  }))

  return NextResponse.json(result)
}

// POST a new movie list with movies
export async function POST(req: NextRequest) {
  const { title, movies, createdBy } = await req.json()

  if (!title || !Array.isArray(movies) || !createdBy) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const list = await prisma.movieList.create({
    data: {
      title,
      createdBy,
      movies: {
        create: movies.map((m: any) => ({
          tmdbId: m.tmdbId,
          title: m.title,
          posterUrl: m.posterUrl,
        })),
      },
    },
    include: {
      movies: true,
      votes: true,
    },
  })

  return NextResponse.json(list)
}
