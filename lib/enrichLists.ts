import { prisma } from './prisma'

export async function enrichLists<T extends { movies: { tmdbId: number }[] }>(
  lists: T[],
  meEmail?: string | null
) {
  const tmdbIds = Array.from(new Set(lists.flatMap((l) => l.movies.map((m) => m.tmdbId))))
  if (tmdbIds.length === 0) return lists

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

  return lists.map((l) => ({
    ...l,
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
