import { prisma } from './prisma'
import { enrichLists } from './enrichLists'

export async function loadRootData(meEmail?: string | null) {
  const now = new Date()

  const [withList, withoutList] = await Promise.all([
    prisma.meetup.findFirst({
      where: { date: { gt: now }, movieListId: { not: null } },
      orderBy: { date: 'asc' },
      include: { movieList: { include: { movies: true, votes: true } } },
    }),
    prisma.meetup.findFirst({
      where: { date: { gt: now }, movieListId: null },
      orderBy: { date: 'asc' },
      include: { movieList: { include: { movies: true, votes: true } } },
    }),
  ])

  const raw =
    [withList, withoutList]
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => +a.date! - +b.date!)[0] ?? null

  if (!raw) {
    return { nextMeetup: null, voteCount: 0 }
  }

  const enrichedMovieList =
    raw.movieList && meEmail ? (await enrichLists([raw.movieList], meEmail))[0] : raw.movieList

  const myVoteCount =
    meEmail && withoutList
      ? await prisma.vote.count({
          where: { userId: meEmail, meetupId: withoutList.id },
        })
      : 0

  return {
    nextMeetup: { ...raw, movieList: enrichedMovieList },
    voteCount: myVoteCount,
  }
}
