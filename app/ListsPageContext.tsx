'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ListFilter, ListSort } from '../types/lists'

type ListsPageContextType = {
  filter: ListFilter
  sortBy: ListSort
  setFilter: (filter: ListFilter) => void
  setSortBy: (sort: ListSort) => void
}

const ListsPageContext = createContext<ListsPageContextType | null>(null)

export function ListsPageProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<ListFilter>(ListFilter.All)
  const [sortBy, setSortBy] = useState<ListSort>(ListSort.Default)

  return (
    <ListsPageContext.Provider value={{ filter, sortBy, setFilter, setSortBy }}>
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
