import { useCallback, useMemo, useEffect } from 'react'
import { MovieListAllWithFlags } from '../page'
import { ListFilter, ListSort } from '../../types/lists'
import { getFilteredLists, getSortedLists } from '../../lib/listHelpers'

/**
 * Hook that returns a handler for toggling the "seen" status of a movie across all lists
 */
export function useToggleSeen(
  setLists: React.Dispatch<React.SetStateAction<MovieListAllWithFlags[]>>
) {
  return useCallback(
    (tmdbId: number, hasSeen: boolean) => {
      setLists((prev) =>
        prev.map((l) => ({
          ...l,
          movies: l.movies.map((m) =>
            m.tmdbId === tmdbId
              ? { ...m, hasSeen: !hasSeen, seenCount: m.seenCount + (hasSeen ? -1 : 1) }
              : m
          ),
        }))
      )
    },
    [setLists]
  )
}

/**
 * Hook that filters and sorts lists based on the current filter and sort options
 */
export function useFilterAndSort(
  lists: MovieListAllWithFlags[],
  filter: ListFilter,
  sortBy: ListSort,
  userEmail?: string
) {
  return useMemo(() => {
    const filtered = getFilteredLists(lists, filter, userEmail)
    return getSortedLists(filtered, sortBy)
  }, [lists, filter, sortBy, userEmail])
}

/**
 * Hook that scrolls to top when filter or sort changes
 */
export function useScrollToTopOnChange(filter: ListFilter, sortBy: ListSort) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filter, sortBy])
}
