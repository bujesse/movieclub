import { prisma } from './prisma'

export async function enrichLists<
  T extends {
    id: number
    movies: { tmdbId: number }[]
  },
>(lists: T[], meEmail?: string | null) {
  const tmdbIds = Array.from(new Set(lists.flatMap((l) => l.movies.map((m) => m.tmdbId))))

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

  // Aggregate all-time votes for all lists
  const listIds = lists.map((l) => l.id)
  const voteAgg = await prisma.vote.groupBy({
    by: ['movieListId'],
    where: { movieListId: { in: listIds } },
    _count: { _all: true },
  })
  const votesTotalMap = new Map<number, number>(voteAgg.map((r) => [r.movieListId, r._count._all]))

  return lists.map((l) => ({
    ...l,
    votesTotal: votesTotalMap.get(l.id) ?? 0,
    movies: l.movies.map((m) => {
      const seenBy = seenByMap.get(m.tmdbId) ?? []
      return {
        ...m,
        seenBy,
        seenCount: seenBy.length,
        hasSeen: mySeen.has(m.tmdbId),
      }
    }),
  }))
}
