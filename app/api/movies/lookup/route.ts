import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getIdentityFromRequest } from '../../../../lib/cfAccess'
import { ensureGlobalMovieWithDetails } from '../../../../lib/tmdb'
import { getMeetupMovieTmdbIds } from '../../../../lib/dbHelpers'
import '../../../../lib/bigintSerializer'

export async function POST(req: NextRequest) {
  const user = await getIdentityFromRequest(req)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const tmdbId = Number(body?.tmdbId)

    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      return NextResponse.json({ error: 'Invalid TMDB ID' }, { status: 400 })
    }

    const movie = await ensureGlobalMovieWithDetails(tmdbId)
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    const [oscarSummary, seenRows, meetupMovieTmdbIds, listRows, collectionRows] = await Promise.all([
      prisma.oscarMovieSummary.findUnique({
        where: { tmdbId },
        select: {
          totalNominations: true,
          totalWins: true,
          categoryBreakdown: true,
        },
      }),
      prisma.seen.findMany({
        where: { tmdbId },
        select: { userId: true },
      }),
      getMeetupMovieTmdbIds(prisma),
      prisma.movieListMovie.findMany({
        where: { movie: { tmdbId }, movieList: { deletedAt: null } },
        select: {
          movieList: {
            select: {
              id: true,
              title: true,
              Meetup: {
                select: { date: true },
              },
            },
          },
        },
      }),
      prisma.collectionMovie.findMany({
        where: { movie: { tmdbId }, collection: { deletedAt: null } },
        select: {
          collection: {
            select: {
              id: true,
              name: true,
              isGlobal: true,
            },
          },
        },
      }),
    ])

    const seenBy = seenRows.map((row) => row.userId).sort((a, b) => a.localeCompare(b))
    const now = new Date()

    const lists = listRows
      .map((row) => {
        const meetupDate = row.movieList.Meetup?.date ?? null
        return {
          id: row.movieList.id,
          title: row.movieList.title,
          isPastMeetup: meetupDate ? meetupDate < now : false,
        }
      })
      .sort((a, b) => a.title.localeCompare(b.title))

    const collections = collectionRows
      .map((row) => row.collection)
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      ...movie,
      seenBy,
      seenCount: seenBy.length,
      hasSeen: seenBy.includes(user.email),
      inMeetup: meetupMovieTmdbIds.has(tmdbId),
      oscarNominations: oscarSummary?.totalNominations ?? 0,
      oscarWins: oscarSummary?.totalWins ?? 0,
      oscarCategories: oscarSummary?.categoryBreakdown ?? null,
      lists,
      collections,
    })
  } catch (err) {
    console.error('Movie lookup failed:', err)
    return NextResponse.json({ error: 'Movie lookup failed' }, { status: 500 })
  }
}
