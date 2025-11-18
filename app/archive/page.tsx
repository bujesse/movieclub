'use client'

import { useState, useEffect } from 'react'
import ListCard from '../ListCard'
import { MovieListAllWithFlags } from '../page'

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

export default function ArchivePage() {
  const [lists, setLists] = useState<MovieListAllWithFlags[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <section className="section">
      <div className="container has-text-centered mb-5">
        <h2 className="title">Archive</h2>
        <p className="subtitle">Past movie lists from previous meetups</p>
      </div>

      {loading ? (
        <p>Loading archive...</p>
      ) : lists.length === 0 ? (
        <p className="has-text-centered has-text-grey">No archived lists yet</p>
      ) : (
        <div className="fixed-grid has-1-cols-mobile	has-2-cols-tablet has-3-cols-widescreen">
          <div className="grid is-row-gap-5 is-column-gap-4 is-multiline">
            {lists.map((l) => (
              <div key={l.id} className="cell">
                <ListCard
                  onToggleSeenAction={onToggleSeen}
                  list={l}
                  onDeleteAction={() => {}}
                  onEditAction={() => {}}
                  isArchiveView={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
