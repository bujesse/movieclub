'use client'

import { useState, useEffect } from 'react'
import NewListModal from './NewListModal'
import ListCard from './ListCard'
import { Prisma } from '@prisma/client'

export type MovieListAll = Prisma.MovieListGetPayload<{
  include: {
    movies: true
    votes: true
  }
}>

// ----------------------
// List Grid Component
// ----------------------
function ListGrid({ lists }: { lists: MovieListAll[] }) {
  return (
    <div className="fixed-grid has-1-cols-mobile	has-2-cols-tablet has-3-cols-widescreen">
      <div className="grid is-row-gap-5 is-column-gap-4 is-multiline">
        {lists.map((l) => (
          <div key={l.id} className="cell">
            <ListCard list={l} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ----------------------
// Home Page
// ----------------------
export default function HomePage() {
  const [lists, setLists] = useState<MovieListAll[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/lists')
        if (!res.ok) throw new Error('Failed to fetch lists')
        const data = await res.json()
        setLists(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [])

  const handleCreateList = async (payload: any) => {
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      console.log('POST response:', data)

      setLists((prev) => [data, ...prev])
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteList = (id: number) => {
    setLists((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <section className="section">
      <div className="container has-text-centered mb-5">
        <h2 className="title">Movie Lists</h2>
        <button className="button is-primary is-medium mt-3" onClick={() => setIsModalOpen(true)}>
          + Create New List
        </button>
      </div>

      {loading ? (
        <p>Loading lists...</p>
      ) : (
        <div className="fixed-grid has-1-cols-mobile	has-2-cols-tablet has-3-cols-widescreen">
          <div className="grid is-row-gap-5 is-column-gap-4 is-multiline">
            {lists.map((l) => (
              <div key={l.id} className="cell">
                <ListCard list={l} onDelete={handleDeleteList} />
              </div>
            ))}
          </div>
        </div>
      )}

      <NewListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateList}
      />
    </section>
  )
}
