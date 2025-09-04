import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { normalizeMovies } from '../../../lib/helpers'
import { getIdentityFromRequest } from '../../../lib/cfAccess'
import { enrichLists } from '../../../lib/enrichLists'

// GET movie lists not associated with a meetup,
// Sorted by number of votes (desc) then createdAt (asc)
export async function GET(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const enriched = await enrichLists(lists, user.email)

  return NextResponse.json(enriched)
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
