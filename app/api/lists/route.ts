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
