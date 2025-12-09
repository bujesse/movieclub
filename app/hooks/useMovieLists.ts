import { useCallback, useMemo, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { MovieListAllWithFlags } from '../page'
import { ListFilter, ListSort } from '../../types/lists'
import { getFilteredLists, getSortedLists } from '../../lib/listHelpers'
import { useListsPage } from '../ListsPageContext'

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

/**
 * Hook that syncs filter and sort state with URL query parameters
 * Call this hook in pages that support filter/sort to enable URL persistence
 * Returns isReady flag that indicates when URL sync is complete
 */
export function useURLSync() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { filter, sortBy, setFilter, setSortBy, updateFromURL, isReady, setIsReady } = useListsPage()

  // Initialize from URL on mount
  useEffect(() => {
    const urlFilter = searchParams.get('filter')
    const urlSort = searchParams.get('sort')

    const newFilter = Object.values(ListFilter).includes(urlFilter as ListFilter)
      ? (urlFilter as ListFilter)
      : ListFilter.All

    const newSort = Object.values(ListSort).includes(urlSort as ListSort)
      ? (urlSort as ListSort)
      : ListSort.Default

    updateFromURL(newFilter, newSort)
    // Mark as ready after state is updated
    setIsReady(true)
  }, [updateFromURL, setIsReady, searchParams])

  // Update URL when filter or sort changes (only if ready)
  useEffect(() => {
    if (!isReady) return

    const params = new URLSearchParams(searchParams.toString())

    if (filter !== ListFilter.All) {
      params.set('filter', filter)
    } else {
      params.delete('filter')
    }

    if (sortBy !== ListSort.Default) {
      params.set('sort', sortBy)
    } else {
      params.delete('sort')
    }

    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(url, { scroll: false })
  }, [filter, sortBy, pathname, router, searchParams, isReady])

  // Sync with URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (!isReady) return

    const urlFilter = searchParams.get('filter')
    const urlSort = searchParams.get('sort')

    const newFilter = Object.values(ListFilter).includes(urlFilter as ListFilter)
      ? (urlFilter as ListFilter)
      : ListFilter.All

    const newSort = Object.values(ListSort).includes(urlSort as ListSort)
      ? (urlSort as ListSort)
      : ListSort.Default

    if (newFilter !== filter || newSort !== sortBy) {
      updateFromURL(newFilter, newSort)
    }
  }, [searchParams, isReady])

  return { isReady }
}
