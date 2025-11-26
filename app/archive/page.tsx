'use client'

import { useState, useEffect } from 'react'
import ListCard from '../ListCard'
import { MovieListAllWithFlags } from '../page'
import { withDuplicateFlags } from '../../lib/listHelpers'
import { useToggleSeen } from '../hooks/useMovieLists'

export default function ArchivePage() {
  const [lists, setLists] = useState<MovieListAllWithFlags[]>([])
  const [loading, setLoading] = useState(true)

  const onToggleSeen = useToggleSeen(setLists)

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
                  list={l}
                  actions={{
                    onEdit: () => {},
                    onDelete: () => {},
                    onToggleSeen,
                  }}
                  display={{
                    isArchiveView: true,
                    initialCommentCount: l.commentCount,
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
