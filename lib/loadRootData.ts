import { prisma } from './prisma'
import { enrichLists } from './enrichLists'

export async function loadRootData(meEmail?: string | null) {
  const raw = await prisma.meetup.findFirst({
    where: { date: { gt: new Date() } },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      movieListId: true,
      movieList: { include: { movies: true, votes: true } },
    },
  })

  if (!raw) {
    return { nextMeetup: null, nextMeetupIso: null, voteCount: 0 }
  }

  const enrichedMovieList = raw.movieList
    ? (await enrichLists([raw.movieList], meEmail ?? undefined))[0]
    : null

  const voteCount = meEmail
    ? await prisma.vote.count({ where: { userId: meEmail, meetupId: raw.id } })
    : 0

  return {
    nextMeetup: { ...raw, movieList: enrichedMovieList },
    nextMeetupIso: raw.date?.toISOString() ?? null,
    voteCount,
  }
}
