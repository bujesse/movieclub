import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { normalizeMovies } from '../../../lib/helpers'
import { getIdentityFromRequest } from '../../../lib/cfAccess'
import { enrichLists } from '../../../lib/enrichLists'
import { getNextMeetupWithoutList } from '../../../lib/dbHelpers'

// GET movie lists not associated with a meetup,
// Sorted by number of votes (desc) then createdAt (asc)
export async function GET(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nextMeetup = await getNextMeetupWithoutList(prisma)
  if (!nextMeetup) return NextResponse.json([]) // no "next" → no votes to include

  const lists = await prisma.movieList.findMany({
    where: {
      Meetup: null,
    },
    include: {
      movies: true,
      votes: { where: { meetupId: nextMeetup.id } },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const enriched = await enrichLists(lists, user.email)

  // Sort by votes desc, then createdAt asc
  enriched.sort((a, b) => {
    const diff = b.votes.length - a.votes.length
    if (diff !== 0) return diff
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

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
