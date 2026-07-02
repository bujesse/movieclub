import { MovieListAllWithFlags } from '../app/page'
import { ListFilter, ListSort } from '../types/lists'

/**
 * Adds duplicate movie flags to lists by counting how many lists each movie appears in
 */
export function withDuplicateFlags(lists: MovieListAllWithFlags[]): MovieListAllWithFlags[] {
  const counts = new Map<number, number>()
  for (const list of lists) {
    for (const m of list.movies) {
      const key = (m as any).tmdbId ?? m.id
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return lists.map((list) => ({
    ...list,
    movies: list.movies.map((m) => {
      const key = (m as any).tmdbId ?? m.id
      const c = counts.get(key) ?? 1
      return {
        ...m,
        inMultipleLists: c > 1,
        listCount: c,
      }
    }),
  }))
}

/**
 * Filters lists based on the selected filter
 */
export function getFilteredLists(
  lists: MovieListAllWithFlags[],
  filter: ListFilter,
  userEmail?: string
): MovieListAllWithFlags[] {
  if (filter === ListFilter.MyLists) {
    return lists.filter((l) => l.createdBy === userEmail)
  } else if (filter === ListFilter.Voted) {
    return lists.filter((l) => l.votes.some((v) => v.userId === userEmail))
  }
  return lists
}

/**
 * Sorts lists based on the selected sort option
 */
export function getSortedLists(
  lists: MovieListAllWithFlags[],
  sortBy: ListSort
): MovieListAllWithFlags[] {
  const result = [...lists]
  const defaultTieBreak = (a: MovieListAllWithFlags, b: MovieListAllWithFlags) => {
    const curVotesA = a.votes?.length ?? 0
    const curVotesB = b.votes?.length ?? 0
    if (curVotesB !== curVotesA) return curVotesB - curVotesA

    if ((b.votesTotal ?? 0) !== (a.votesTotal ?? 0))
      return (b.votesTotal ?? 0) - (a.votesTotal ?? 0)

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  }
  const totalRuntime = (list: MovieListAllWithFlags) =>
    list.movies.reduce(
      (sum, movie) => sum + (movie.runtime && movie.runtime > 0 ? movie.runtime : 0),
      0
    )

  if (sortBy === ListSort.VotesDesc) {
    result.sort((a, b) => {
      return (b.votesTotal ?? 0) - (a.votesTotal ?? 0)
    })
  } else if (sortBy === ListSort.MostSeen) {
    result.sort((a, b) => {
      const avgSeenA = a.movies.reduce((sum, m) => sum + m.seenCount, 0) / a.movies.length
      const avgSeenB = b.movies.reduce((sum, m) => sum + m.seenCount, 0) / b.movies.length
      if (avgSeenB !== avgSeenA) return avgSeenB - avgSeenA

      return defaultTieBreak(a, b)
    })
  } else if (sortBy === ListSort.LeastSeen) {
    result.sort((a, b) => {
      const avgSeenA = a.movies.reduce((sum, m) => sum + m.seenCount, 0) / a.movies.length
      const avgSeenB = b.movies.reduce((sum, m) => sum + m.seenCount, 0) / b.movies.length
      if (avgSeenA !== avgSeenB) return avgSeenA - avgSeenB

      return defaultTieBreak(a, b)
    })
  } else if (sortBy === ListSort.Longest) {
    result.sort((a, b) => {
      const runtimeA = totalRuntime(a)
      const runtimeB = totalRuntime(b)
      if (runtimeB !== runtimeA) return runtimeB - runtimeA

      if (b.movies.length !== a.movies.length) return b.movies.length - a.movies.length

      return defaultTieBreak(a, b)
    })
  } else if (sortBy === ListSort.Shortest) {
    result.sort((a, b) => {
      const runtimeA = totalRuntime(a)
      const runtimeB = totalRuntime(b)
      if (runtimeA !== runtimeB) return runtimeA - runtimeB

      if (a.movies.length !== b.movies.length) return a.movies.length - b.movies.length

      return defaultTieBreak(a, b)
    })
  } else if (sortBy === ListSort.CreatedDesc) {
    result.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  } else if (sortBy === ListSort.CreatedAsc) {
    result.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  return result
}
