import { prisma } from './prisma'
import { getMeetupMovieTmdbIds, getUnscheduledMovieListTmdbIds } from './dbHelpers'

export async function enrichCollections<
  T extends {
    id: number
    movies: { movie: { tmdbId: number } }[]
  },
>(collections: T[], meEmail?: string | null) {
  const tmdbIds = Array.from(
    new Set(collections.flatMap((c) => c.movies.map((m) => m.movie.tmdbId)))
  )

  // Fetch movies that have been in meetups
  const meetupMovieTmdbIds = await getMeetupMovieTmdbIds(prisma)

  // Fetch movies that are in lists without meetups
  const unscheduledMovieTmdbIds = await getUnscheduledMovieListTmdbIds(prisma)

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

  return collections.map((c) => {
    const enrichedMovies = c.movies.map((m) => {
      const seenBy = seenByMap.get(m.movie.tmdbId) ?? []
      const oscarData = oscarMap.get(m.movie.tmdbId)
      return {
        ...m,
        movie: {
          ...m.movie,
          seenBy,
          seenCount: seenBy.length,
          hasSeen: mySeen.has(m.movie.tmdbId),
          inMeetup: meetupMovieTmdbIds.has(m.movie.tmdbId),
          inUnscheduledList: unscheduledMovieTmdbIds.has(m.movie.tmdbId),
          oscarNominations: oscarData?.totalNominations ?? 0,
          oscarWins: oscarData?.totalWins ?? 0,
          oscarCategories: oscarData?.categoryBreakdown ?? null,
        },
      }
    })

    // Calculate stats
    const userSeenCount = meEmail
      ? enrichedMovies.filter((m) => m.movie.hasSeen).length
      : 0
    const clubSeenCount = enrichedMovies.filter((m) => m.movie.inMeetup).length
    const anyoneSeenCount = enrichedMovies.filter((m) => m.movie.seenCount > 0).length

    return {
      ...c,
      movies: enrichedMovies,
      stats: {
        userSeenCount,
        clubSeenCount,
        anyoneSeenCount,
      },
    }
  })
}
