'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [listTitle, setListTitle] = useState('')
  const [movieInput, setMovieInput] = useState('')
  const [movieArray, setMovieArray] = useState<string[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true) // Loading state

  // Fetch lists from backend on mount
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

  // Add movie to local array
  const addMovieToArray = () => {
    if (!movieInput.trim()) return
    setMovieArray([...movieArray, movieInput])
    setMovieInput('')
  }

  // Submit list to backend
  const createList = async () => {
    if (!listTitle || movieArray.length === 0) return

    const payload = {
      title: listTitle,
      createdBy: 'dummyUserId', // dummy for now
      movies: movieArray.map((title) => ({
        tmdbId: 'dummy_' + Date.now() + Math.random().toString(36).substring(2),
        title,
        posterUrl: 'https://via.placeholder.com/150',
      })),
    }

    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      console.log('POST response:', data)

      // Add to local state
      setLists((prev) => [...prev, { ...payload, totalVotes: 0, id: Date.now() }])

      setListTitle('')
      setMovieArray([])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <section className="container">
      <h2>Create a Movie List</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          createList()
        }}
        className="grid gap-2 mb-6"
      >
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

        <button type="submit">Create List</button>
      </form>

      <h2>Movie Lists</h2>

      {loading ? (
        <p>Loading lists...</p>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          {lists.map((l) => (
            <article key={l.id} className="card">
              <h3>{l.title}</h3>
              <p>
                <small>Created by: {l.createdBy}</small>
              </p>
              <ul>
                {l.movies.map((m: any, i: number) => (
                  <li key={i}>{m.title}</li>
                ))}
              </ul>
              <p>
                <strong>Votes: {l.totalVotes}</strong>
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
