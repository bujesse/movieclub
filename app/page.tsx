'use client'

import { useState, useEffect, useMemo } from 'react'
import ListModal from './ListModal'
import ListCard from './ListCard'
import { Prisma } from '@prisma/client'
import { useRouter } from 'next/navigation'
import NextMeetupCard from './NextMeetupCard'
import { useCurrentUser } from './CurrentUserProvider'
import FilterSortControls from './FilterSortControls'
import { useListsPage } from './ListsPageContext'
import { ListFilter, ListSort } from '../types/lists'

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

function withDuplicateFlags(lists: MovieListAllWithFlags[]): MovieListAllWithFlags[] {
  // Count how many lists each movie appears in (by tmdbId if present, else by id)
  const counts = new Map<number, number>()
  for (const list of lists) {
    for (const m of list.movies) {
      const key = (m as any).tmdbId ?? m.id
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  // Attach flags to each movie
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

// ----------------------
// Home Page
// ----------------------
export default function HomePage() {
  const [lists, setLists] = useState<MovieListAllWithFlags[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialList, setInitialList] = useState<MovieListAll | undefined>(undefined)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const router = useRouter()
  const { user } = useCurrentUser()
  const { filter, sortBy, setFilter, setSortBy } = useListsPage()

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/lists')
        if (!res.ok) throw new Error('Failed to fetch lists')
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

  // Scroll to top when filter or sort changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filter, sortBy])

  const handleCreateNewList = () => {
    setInitialList(undefined)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleSubmit = async (payload: any) => {
    try {
      const isEdit = modalMode === 'edit' && initialList
      const url = isEdit ? `/api/lists/${initialList!.id}` : '/api/lists'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.error(`${method} failed`, await res.text())
        return
      }

      const data = await res.json()

      setLists((prev) => {
        const next =
          modalMode === 'edit' && initialList
            ? prev.map((l) => (l.id === data.id ? data : l))
            : [data, ...prev]
        return withDuplicateFlags(next as MovieListAllWithFlags[])
      })

      setIsModalOpen(false)
      setInitialList(undefined)
      setModalMode('create')
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteList = (id: number) => {
    setLists((prev) =>
      withDuplicateFlags(prev.filter((l) => l.id !== id) as MovieListAllWithFlags[])
    )
  }

  const handleEditList = (id: number) => {
    const listToEdit = lists.find((l) => l.id === id)
    if (!listToEdit) return
    setInitialList(listToEdit)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const onToggleSeen = (tmdbId: number, hasSeen: boolean) => {
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
  }

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

  // Filter and sort lists
  const filteredAndSortedLists = useMemo(() => {
    let result = [...lists]

    // Apply filter
    if (filter === ListFilter.MyLists) {
      result = result.filter((l) => l.createdBy === user?.email)
    } else if (filter === ListFilter.Voted) {
      result = result.filter((l) => l.votes.some((v) => v.userId === user?.email))
    }

    // Apply sort
    if (sortBy === ListSort.VotesDesc) {
      result.sort((a, b) => {
        return (b.votesTotal ?? 0) - (a.votesTotal ?? 0)
      })
    } else if (sortBy === ListSort.MostSeen) {
      result.sort((a, b) => {
        // Primary: Most seen (desc)
        const avgSeenA = a.movies.reduce((sum, m) => sum + m.seenCount, 0) / a.movies.length
        const avgSeenB = b.movies.reduce((sum, m) => sum + m.seenCount, 0) / b.movies.length
        if (avgSeenB !== avgSeenA) return avgSeenB - avgSeenA

        // Secondary: Current votes (desc)
        const curVotesA = a.votes?.length ?? 0
        const curVotesB = b.votes?.length ?? 0
        if (curVotesB !== curVotesA) return curVotesB - curVotesA

        // Tertiary: All-time votes (desc)
        if ((b.votesTotal ?? 0) !== (a.votesTotal ?? 0))
          return (b.votesTotal ?? 0) - (a.votesTotal ?? 0)

        // Quaternary: Oldest first (asc)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
    } else if (sortBy === ListSort.LeastSeen) {
      result.sort((a, b) => {
        // Primary: Least seen (asc)
        const avgSeenA = a.movies.reduce((sum, m) => sum + m.seenCount, 0) / a.movies.length
        const avgSeenB = b.movies.reduce((sum, m) => sum + m.seenCount, 0) / b.movies.length
        if (avgSeenA !== avgSeenB) return avgSeenA - avgSeenB

        // Secondary: Current votes (desc)
        const curVotesA = a.votes?.length ?? 0
        const curVotesB = b.votes?.length ?? 0
        if (curVotesB !== curVotesA) return curVotesB - curVotesA

        // Tertiary: All-time votes (desc)
        if ((b.votesTotal ?? 0) !== (a.votesTotal ?? 0))
          return (b.votesTotal ?? 0) - (a.votesTotal ?? 0)

        // Quaternary: Oldest first (asc)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
  }, [lists, filter, sortBy, user?.email])

  return (
    <section className="section">
      <NextMeetupCard onToggleSeenAction={onToggleSeen} />

      <div className="container has-text-centered mb-5">
        <h2 className="title">Movie Lists</h2>
        <button className="button is-primary is-medium mt-3" onClick={handleCreateNewList}>
          + Create New List
        </button>
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
        <p>Loading lists...</p>
      ) : (
        <div
          className="fixed-grid has-1-cols-mobile	has-2-cols-tablet has-3-cols-widescreen"
          style={{ paddingBottom: '5rem' }}
        >
          <div className="grid is-row-gap-5 is-column-gap-4 is-multiline">
            {filteredAndSortedLists.map((l) => (
              <div key={l.id} className="cell">
                <ListCard
                  onToggleSeenAction={onToggleSeen}
                  list={l}
                  onDeleteAction={handleDeleteList}
                  onEditAction={handleEditList}
                  onVoteChangeAction={onVoteChange}
                  initialCommentCount={l.commentCount}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <ListModal
        key={modalMode} // new key → new instance; fixes flash of old data when switching modes
        isOpen={isModalOpen}
        mode={modalMode}
        initialList={initialList}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
