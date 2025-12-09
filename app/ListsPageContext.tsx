'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { ListFilter, ListSort } from '../types/lists'

type ListsPageContextType = {
  filter: ListFilter
  sortBy: ListSort
  setFilter: (filter: ListFilter) => void
  setSortBy: (sort: ListSort) => void
  updateFromURL: (filter: ListFilter, sort: ListSort) => void
  isReady: boolean
  setIsReady: (ready: boolean) => void
}

const ListsPageContext = createContext<ListsPageContextType | null>(null)

export function ListsPageProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<ListFilter>(ListFilter.All)
  const [sortBy, setSortByState] = useState<ListSort>(ListSort.Default)
  const [isReady, setIsReady] = useState(false)

  const setFilter = useCallback((newFilter: ListFilter) => {
    setFilterState(newFilter)
  }, [])

  const setSortBy = useCallback((newSort: ListSort) => {
    setSortByState(newSort)
  }, [])

  const updateFromURL = useCallback((newFilter: ListFilter, newSort: ListSort) => {
    setFilterState(newFilter)
    setSortByState(newSort)
  }, [])

  return (
    <ListsPageContext.Provider value={{ filter, sortBy, setFilter, setSortBy, updateFromURL, isReady, setIsReady }}>
      {children}
    </ListsPageContext.Provider>
  )
}

export function useListsPage() {
  const context = useContext(ListsPageContext)
  if (!context) {
    throw new Error('useListsPage must be used within ListsPageProvider')
  }
  return context
}
