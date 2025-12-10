import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { normalizeMovies } from '../../../lib/helpers'
import { getIdentityFromRequest } from '../../../lib/cfAccess'
import { enrichLists } from '../../../lib/enrichLists'
import { getNextMeetupWithoutList } from '../../../lib/dbHelpers'
import { saveMovieDetails } from '../../../lib/tmdb'

// GET movie lists not associated with a meetup,
// Sorted by current votes desc, all-time votes desc, createdAt asc
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
      nominations: { where: { meetupId: nextMeetup.id } },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const enriched = await enrichLists(lists, user.email)

  // Sort: current votes desc, all-time votes desc, createdAt asc
  enriched.sort((a, b) => {
    const cur = (b.votes?.length ?? 0) - (a.votes?.length ?? 0)
    if (cur !== 0) return cur
    const allTime = (b.votesTotal ?? 0) - (a.votesTotal ?? 0)
    if (allTime !== 0) return allTime
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  try {
    const user = await getIdentityFromRequest(req)
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, description, createdBy, movies } = await req.json()
    const nextMeetup = await getNextMeetupWithoutList(prisma)

    const list = await prisma.movieList.create({
      data: {
        title,
        description,
        createdBy,
        movies: { create: normalizeMovies(movies) },
      },
      include: {
        movies: true,
        votes: nextMeetup ? { where: { meetupId: nextMeetup.id } } : true,
        nominations: nextMeetup ? { where: { meetupId: nextMeetup.id } } : true,
      },
    })

    // hydrate details for new movies
    const ids = Array.from(new Set(list.movies.map((m) => m.tmdbId)))
    await Promise.allSettled(ids.map((id) => saveMovieDetails(id)))

    // Re-fetch the list with updated movie details
    const updatedList = await prisma.movieList.findUnique({
      where: { id: list.id },
      include: {
        movies: true,
        votes: nextMeetup ? { where: { meetupId: nextMeetup.id } } : true,
        nominations: nextMeetup ? { where: { meetupId: nextMeetup.id } } : true,
      },
    })

    if (!updatedList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Enrich with Oscar data, seen counts, etc.
    const [enriched] = await enrichLists([updatedList], user.email)

    return NextResponse.json(enriched, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate movie' }, { status: 409 })
    }
    console.error('Create failed:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
