'use client'

import { useState, useEffect } from 'react'
import ListCard from './ListCard'
import { Prisma } from '@prisma/client'
import { useRouter } from 'next/navigation'
import NextMeetupCard from './NextMeetupCard'
import { useCurrentUser } from './CurrentUserProvider'
import FilterSortControls from './FilterSortControls'
import { useListsPage } from './ListsPageContext'
import { ROUTES } from '../lib/routes'
import { withDuplicateFlags } from '../lib/listHelpers'
import { useToggleSeen, useFilterAndSort, useScrollToTopOnChange } from './hooks/useMovieLists'

export type MovieListAll = Prisma.MovieListGetPayload<{
  include: {
    movies: true
    votes: true
  }
}>

export type MovieListAllWithFlags = Omit<MovieListAll, 'movies'> & {
  votesTotal: number
  commentCount: number
  movies: (MovieListAll['movies'][number] & {
    inMultipleLists: boolean
    listCount: number
    seenBy: string[]
    seenCount: number
    hasSeen: boolean
  })[]
}
export default function HomePage() {
  const [lists, setLists] = useState<MovieListAllWithFlags[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const { user } = useCurrentUser()
  const { filter, sortBy, setFilter, setSortBy } = useListsPage()

  const onToggleSeen = useToggleSeen(setLists)
  useScrollToTopOnChange(filter, sortBy)

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/lists/nominated')
        if (!res.ok) throw new Error('Failed to fetch nominated lists')
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

  const onVoteChange = (listId: number, hasVoted: boolean, allTimeScore: number) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l

        // Update votes array based on hasVoted state
        const updatedVotes = hasVoted
          ? [...l.votes, { userId: user!.email, value: 1 } as any]
          : l.votes.filter((v) => v.userId !== user?.email)

        return {
          ...l,
          votes: updatedVotes,
          votesTotal: allTimeScore,
        }
      })
    )
  }

  const filteredAndSortedLists = useFilterAndSort(lists, filter, sortBy, user?.email)

  return (
    <section className="section">
      <NextMeetupCard onToggleSeenAction={onToggleSeen} />

      <div className="container has-text-centered mb-5">
        <h2 className="title">Nominated Lists</h2>
        <p className="subtitle">Vote for your favorite nominated list for the next meetup</p>
      </div>

      {/* Mobile Bottom Nav (Sticky) */}
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

      {loading ? (
        <p>Loading nominated lists...</p>
      ) : lists.length === 0 ? (
        <div className="container has-text-centered">
          <p className="has-text-grey">No lists have been nominated yet.</p>
          <p className="has-text-grey mt-2">
            Go to <a href={ROUTES.LISTS}>All Lists</a> to nominate a list for the next meetup.
          </p>
        </div>
      ) : filteredAndSortedLists.length === 0 ? (
        <div className="container has-text-centered">
          <p className="has-text-grey">No results match your current filter.</p>
        </div>
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
                    showNominatedBy: true,
                    initialCommentCount: l.commentCount,
                  }}
                  voting={{
                    onVoteChange,
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
