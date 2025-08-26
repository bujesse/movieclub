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
      className="grid"
      style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}
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
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'var(--pico-background-color)',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Create Movie List</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="listTitle">List Title</label>
            <input
              id="listTitle"
              type="text"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              placeholder="Enter list title..."
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="movieInput">Add Movies</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="movieInput"
                type="text"
                value={movieInput}
                onChange={(e) => setMovieInput(e.target.value)}
                placeholder="Enter movie title..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMovieToArray())}
              />
              <button type="button" onClick={addMovieToArray}>
                Add
              </button>
            </div>
          </div>

          {movieArray.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4>Movies in this list:</h4>
              <ul>
                {movieArray.map((movie, index) => (
                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{movie}</span>
                    <button
                      type="button"
                      onClick={() => setMovieArray(prev => prev.filter((_, i) => i !== index))}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--pico-del-color)', 
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <footer style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={!listTitle || movieArray.length === 0}>
              Create List
            </button>
          </footer>
        </form>
      </div>
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
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2>Movie Lists</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          + Create New List
        </button>
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
