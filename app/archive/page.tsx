'use client'

import { useState, useEffect, Suspense } from 'react'
import ListCard from '../ListCard'
import { MovieListAllWithFlags } from '../page'
import { withDuplicateFlags } from '../../lib/listHelpers'
import { useToggleSeen, useFilterAndSort, useScrollToTopOnChange, useURLSync } from '../hooks/useMovieLists'
import { useListsPage } from '../ListsPageContext'
import { useCurrentUser } from '../CurrentUserProvider'
import FilterSortControls from '../FilterSortControls'

function ArchivePageContent() {
  const [lists, setLists] = useState<MovieListAllWithFlags[]>([])
  const [loading, setLoading] = useState(true)

  const { user } = useCurrentUser()
  const { filter, sortBy, setFilter, setSortBy } = useListsPage()

  // Enable URL persistence for filters and sorting
  const { isReady } = useURLSync()

  const onToggleSeen = useToggleSeen(setLists)
  useScrollToTopOnChange(filter, sortBy)

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/lists/archive')
        if (!res.ok) throw new Error('Failed to fetch archive lists')
        const data = await res.json()
        setLists(withDuplicateFlags(data))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [])

  const filteredAndSortedLists = useFilterAndSort(lists, filter, sortBy, user?.email)

  return (
    <section className="section">
      <div className="container has-text-centered mb-5">
        <h2 className="title">Archive</h2>
        <p className="subtitle">Past movie lists from previous meetups</p>
      </div>

      {isReady && (
        <div className="navbar is-dark is-fixed-bottom is-hidden-desktop">
          <div
            className="is-flex is-justify-content-center"
            style={{
              padding: '0.75rem',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
            }}
          >
            <FilterSortControls
              filter={filter}
              sortBy={sortBy}
              onFilterChangeAction={setFilter}
              onSortChangeAction={setSortBy}
              variant="compact"
            />
          </div>
        </div>
      )}

      {!isReady || loading ? (
        <p>Loading archive...</p>
      ) : filteredAndSortedLists.length === 0 ? (
        <p className="has-text-centered has-text-grey">No archived lists match your filters</p>
      ) : (
        <div
          className="fixed-grid has-1-cols-mobile	has-2-cols-tablet has-3-cols-widescreen"
          style={{ paddingBottom: '5rem' }}
        >
          <div className="grid is-row-gap-5 is-column-gap-4 is-multiline">
            {filteredAndSortedLists.map((l) => (
              <div key={l.id} className="cell">
                <ListCard
                  list={l}
                  actions={{
                    onEdit: () => {},
                    onDelete: () => {},
                    onToggleSeen,
                  }}
                  display={{
                    isArchiveView: true,
                    initialCommentCount: l.commentCount,
                    showNominatedBy: true,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default function ArchivePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArchivePageContent />
    </Suspense>
  )
}
