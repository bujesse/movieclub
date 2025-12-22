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

  const [listRows, collectionRows] = await Promise.all([
    prisma.movieListMovie.findMany({
      where: { movie: { tmdbId } },
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
      where: { movie: { tmdbId } },
      select: {
        collection: {
          select: { id: true, name: true, isGlobal: true },
        },
      },
    }),
  ])

  const now = new Date()
  const lists = listRows
    .map((row) => {
      const meetupDate = row.movieList.Meetup?.date ?? null
      const isPastMeetup = meetupDate ? meetupDate < now : false
      return { id: row.movieList.id, title: row.movieList.title, isPastMeetup }
    })
    .sort((a, b) => a.title.localeCompare(b.title))
  const collections = collectionRows
    .map((row) => row.collection)
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ lists, collections })
}
