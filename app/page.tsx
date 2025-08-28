'use client'

import { useState, useEffect } from 'react'
import NewListModal from './NewListModal'
import { Prisma } from '@prisma/client'

type MovieList = Prisma.MovieListGetPayload<{
  include: {
    movies: true
    votes: true
  }
}>

// ----------------------
// List Card Component
// ----------------------
function ListCard({ list, onUpvote }: { list: MovieList; onUpvote: (id: number) => void }) {
  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault()
    onUpvote(list.id)
  }

  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title">{list.title}</p>
      </header>
      <div className="card-content">
        <div className="content">
          <small>Created by: {list.createdBy}</small>
          <ul>
            {list.movies.map((m: any, i: number) => (
              <li key={i}>{m.title}</li>
            ))}
          </ul>
          <strong>Votes: {list.votes.reduce((acc, v) => acc + v.value, 0)}</strong>
        </div>
      </div>
      <footer className="card-footer">
        <a href="#" className="card-footer-item">
          Upvote
        </a>
        <a href="#" className="card-footer-item has-text-danger">
          Delete
        </a>
      </footer>
    </div>
  )
}

// ----------------------
// List Grid Component
// ----------------------
function ListGrid({ lists, onUpvote }: { lists: MovieList[]; onUpvote: (id: number) => void }) {
  return (
    <div className="columns is-multiline">
      {lists.map((l) => (
        <div key={l.id} className="column is-one-third">
          <ListCard list={l} onUpvote={onUpvote} />
        </div>
      ))}
    </div>
  )
}

// ----------------------
// Home Page
// ----------------------
export default function HomePage() {
  const [lists, setLists] = useState<MovieList[]>([])
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

  const handleUpvote = (id: number) => {
    console.log('Upvote list with ID:', id)
  }

  return (
    <section className="section">
      <div className="container has-text-centered mb-5">
        <h2 className="title">Movie Lists</h2>
        <button className="button is-primary is-medium mt-3" onClick={() => setIsModalOpen(true)}>
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
