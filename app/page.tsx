'use client'

import { useState, useEffect } from 'react'

// ----------------------
// List Card Component
// ----------------------
function ListCard({ list, onUpvote }: { list: any; onUpvote: (id: number) => void }) {
  return (
    <article className="card">
      <h3>{list.title}</h3>
      <p>
        <small>Created by: {list.createdBy}</small>
      </p>
      <ul>
        {list.movies.map((m: any, i: number) => (
          <li key={i}>{m.title}</li>
        ))}
      </ul>
      <p>
        <strong>Votes: {list.totalVotes}</strong>
      </p>
      <button onClick={() => onUpvote(list.id)}>⬆️ Upvote</button>
    </article>
  )
}

// ----------------------
// List Grid Component
// ----------------------
function ListGrid({ lists, onUpvote }: { lists: any[]; onUpvote: (id: number) => void }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
    >
      {lists.map((l) => (
        <ListCard key={l.id} list={l} onUpvote={onUpvote} />
      ))}
    </div>
  )
}

// ----------------------
// Modal Form Component
// ----------------------
function NewListModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: (payload: any) => void
}) {
  const [listTitle, setListTitle] = useState('')
  const [movieInput, setMovieInput] = useState('')
  const [movieArray, setMovieArray] = useState<string[]>([])

  const addMovieToArray = () => {
    if (!movieInput.trim()) return
    setMovieArray((prev) => [...prev, movieInput])
    setMovieInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!listTitle || movieArray.length === 0) return

    const payload = {
      title: listTitle,
      createdBy: 'dummyUserId',
      movies: movieArray.map((title) => ({
        tmdbId: 'dummy_' + Date.now() + Math.random().toString(36).substring(2),
        title,
        posterUrl: 'https://via.placeholder.com/150',
      })),
    }

    onCreate(payload)
    setListTitle('')
    setMovieArray([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop">
      <div className="modal card">
        <h2>Create a New Movie List</h2>
        <form onSubmit={handleSubmit} className="grid gap-2">
          <input
            type="text"
            placeholder="List title"
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
          />

          <div className="grid gap-1">
            <input
              type="text"
              placeholder="Add a movie"
              value={movieInput}
              onChange={(e) => setMovieInput(e.target.value)}
            />
            <button type="button" onClick={addMovieToArray}>
              Add Movie
            </button>
          </div>

          {movieArray.length > 0 && <p>Movies: {movieArray.join(', ')}</p>}

          <div className="flex gap-2">
            <button type="submit">Create List</button>
            <button type="button" onClick={onClose} className="secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .modal {
          max-width: 500px;
          width: 100%;
          padding: 1rem;
        }
      `}</style>
    </div>
  )
}

// ----------------------
// Home Page
// ----------------------
export default function HomePage() {
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch lists on mount
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

      setLists((prev) => [...prev, { ...payload, totalVotes: 0, id: Date.now() }])
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpvote = (id: number) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, totalVotes: l.totalVotes + 1 } : l)))
  }

  return (
    <section className="container">
      <div className="flex justify-between items-center mb-6">
        <h2>Movie Lists</h2>
        <button onClick={() => setIsModalOpen(true)}>+ New List</button>
      </div>

      {loading ? <p>Loading lists...</p> : <ListGrid lists={lists} onUpvote={handleUpvote} />}

      <NewListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateList}
      />
    </section>
  )
}
