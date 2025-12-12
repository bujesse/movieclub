import { prisma } from './prisma'
import { getMeetupMovieTmdbIds } from './dbHelpers'

export async function enrichLists<
  T extends {
    id: number
    movies: { tmdbId: number }[]
  },
>(lists: T[], meEmail?: string | null) {
  const tmdbIds = Array.from(new Set(lists.flatMap((l) => l.movies.map((m) => m.tmdbId))))

  // Fetch movies that have been in meetups
  const meetupMovieTmdbIds = await getMeetupMovieTmdbIds(prisma)

  // Fetch "seen" data
  const seenRows = await prisma.seen.findMany({
    where: { tmdbId: { in: tmdbIds } },
    select: { tmdbId: true, userId: true },
  })
  const seenByMap = new Map<number, string[]>()
  for (const r of seenRows) {
    const arr = seenByMap.get(r.tmdbId) ?? []
    arr.push(r.userId)
    seenByMap.set(r.tmdbId, arr)
  }
  const mySeen = new Set(
    meEmail ? seenRows.filter((r) => r.userId === meEmail).map((r) => r.tmdbId) : []
  )

  // Fetch Oscar data for all movies
  const oscarSummaries = await prisma.oscarMovieSummary.findMany({
    where: { tmdbId: { in: tmdbIds } },
    select: {
      tmdbId: true,
      totalNominations: true,
      totalWins: true,
      categoryBreakdown: true,
    },
  })

  const oscarMap = new Map(
    oscarSummaries.map((o) => [
      o.tmdbId,
      {
        totalNominations: o.totalNominations,
        totalWins: o.totalWins,
        categoryBreakdown: o.categoryBreakdown as Record<
          string,
          { nominations: number; wins: number }
        >,
      },
    ])
  )

  // Aggregate all-time votes for all lists
  const listIds = lists.map((l) => l.id)
  const voteAgg = await prisma.vote.groupBy({
    by: ['movieListId'],
    where: { movieListId: { in: listIds } },
    _count: { _all: true },
  })
  const votesTotalMap = new Map<number, number>(voteAgg.map((r) => [r.movieListId, r._count._all]))

  // Aggregate comment counts for all lists
  const commentAgg = await prisma.comment.groupBy({
    by: ['movieListId'],
    where: { movieListId: { in: listIds } },
    _count: { _all: true },
  })
  const commentCountMap = new Map<number, number>(
    commentAgg.map((r) => [r.movieListId, r._count._all])
  )

  return lists.map((l) => ({
    ...l,
    votesTotal: votesTotalMap.get(l.id) ?? 0,
    commentCount: commentCountMap.get(l.id) ?? 0,
    movies: l.movies.map((m) => {
      const seenBy = seenByMap.get(m.tmdbId) ?? []
      const oscarData = oscarMap.get(m.tmdbId)
      return {
        ...m,
        seenBy,
        seenCount: seenBy.length,
        hasSeen: mySeen.has(m.tmdbId),
        inMeetup: meetupMovieTmdbIds.has(m.tmdbId),
        // Oscar fields
        oscarNominations: oscarData?.totalNominations ?? 0,
        oscarWins: oscarData?.totalWins ?? 0,
        oscarCategories: oscarData?.categoryBreakdown ?? null,
      }
    }),
  }))
}
