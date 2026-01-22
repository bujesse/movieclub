'use client'

import { useEffect, useState } from 'react'
import Autocomplete from './Autocomplete'
import { searchTmdb, tmdbImage } from '../lib/tmdb'
import type { TmdbMovie } from '../types/tmdb'
import type { EnrichedCollection } from '../types/collection'
import { useCurrentUser } from './CurrentUserProvider'

export type CollectionMovieInput = {
  tmdbId: number
  title: string
  originalTitle?: string | null
  originalLanguage?: string | null
  releaseDate?: string | null
  overview?: string | null
  voteAverage?: number | null
  voteCount?: number | null
  posterPath?: string | null
  backdropPath?: string | null
  genres?: number[] | null
}

export type CollectionPayload = {
  name: string
  description: string
  isGlobal: boolean
  movies: CollectionMovieInput[]
}

type CollectionModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: CollectionPayload) => void
  mode?: 'create' | 'edit'
  initialCollection?: EnrichedCollection
}

export default function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialCollection,
}: CollectionModalProps) {
  const { isAdminMode } = useCurrentUser()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [movieInput, setMovieInput] = useState('')
  const [movieArray, setMovieArray] = useState<TmdbMovie[]>([])
  const [isGlobal, setIsGlobal] = useState(false)
  const [meetupMovieTmdbIds, setMeetupMovieTmdbIds] = useState<Set<number>>(new Set())
  const [showErrors, setShowErrors] = useState(false)

  const hasMovies = movieArray.length > 0
  const isValid = name.trim() !== '' && hasMovies

  useEffect(() => {
    if (isOpen) {
      fetch('/api/meetups/movies')
        .then((res) => res.json())
        .then((data) => setMeetupMovieTmdbIds(new Set(data)))
        .catch((err) => console.error('Failed to fetch meetup movies:', err))
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    setShowErrors(false)

    if (mode === 'edit' && initialCollection) {
      setName(initialCollection.name)
      setDescription(initialCollection.description ?? '')
      setIsGlobal(Boolean(initialCollection.isGlobal))
      setMovieArray(
        initialCollection.movies.map((m) => ({
          id: m.movie.tmdbId,
          title: m.movie.title,
          adult: false,
          original_title: m.movie.originalTitle ?? m.movie.title,
          original_language: m.movie.originalLanguage ?? '',
          popularity: 0,
          release_date: m.movie.releaseDate
            ? new Date(m.movie.releaseDate).toISOString().slice(0, 10)
            : '',
          overview: m.movie.overview ?? '',
          vote_average: m.movie.voteAverage ?? 0,
          vote_count: m.movie.voteCount ?? 0,
          poster_path: m.movie.posterPath ?? null,
          backdrop_path: m.movie.backdropPath ?? null,
          genre_ids: Array.isArray(m.movie.genres)
            ? m.movie.genres.filter((g): g is number => typeof g === 'number')
            : [],
          video: false,
        }))
      )
    } else if (mode === 'create') {
      setName('')
      setDescription('')
      setIsGlobal(false)
      setMovieArray([])
    }
  }, [isOpen, mode, initialCollection])

  const labelFor = (m: TmdbMovie) => `${m.title} (${m.release_date?.slice(0, 4) || 'N/A'})`

  const addMovieToArray = (movie: TmdbMovie) => {
    setMovieArray((prev) => (prev.some((m) => m.id === movie.id) ? prev : [...prev, movie]))
    setMovieInput('')
  }

  const moveMovie = (index: number, direction: -1 | 1) => {
    setMovieArray((prev) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setShowErrors(true)
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      isGlobal: isAdminMode ? isGlobal : false,
      movies: movieArray.map((m) => ({
        tmdbId: Number(m.id),
        title: m.title,
        originalTitle: m.original_title ?? null,
        originalLanguage: m.original_language ?? null,
        releaseDate: m.release_date ?? null,
        overview: m.overview ?? null,
        voteAverage: m.vote_average ?? null,
        voteCount: m.vote_count ?? null,
        posterPath: m.poster_path ?? null,
        backdropPath: m.backdrop_path ?? null,
        genres: Array.isArray(m.genre_ids) ? m.genre_ids : null,
      })),
    })

    handleModalClose()
  }

  const handleModalClose = () => {
    setShowErrors(false)
    setMovieInput('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={handleModalClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">
            {mode === 'edit' ? 'Edit Collection' : 'Create New Collection'}
          </p>
          <button className="delete" aria-label="close" onClick={handleModalClose}></button>
        </header>
        <section className="modal-card-body">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="collectionName">
                Collection Name
              </label>
              <div className="control">
                <input
                  id="collectionName"
                  className={`input ${showErrors && !name.trim() ? 'is-danger' : ''}`}
                  placeholder="e.g., IMDB Top 250"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {showErrors && !name.trim() && (
                <p className="help is-danger">Collection name is required</p>
              )}
            </div>

            <div className="field">
              <label className="label" htmlFor="collectionDescription">
                Description
              </label>
              <div className="control">
                <textarea
                  id="collectionDescription"
                  className="textarea"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="movieInput">
                Add Movie
              </label>
              <Autocomplete<TmdbMovie>
                placeholder="Search TMDB..."
                value={movieInput}
                onChange={setMovieInput}
                fetchItems={searchTmdb}
                getLabel={labelFor}
                onSelect={addMovieToArray}
              />
            </div>

            {isAdminMode && (
              <div className="field">
                <div className="control">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={isGlobal}
                      onChange={(e) => setIsGlobal(e.target.checked)}
                    />
                    <span className="ml-2">Global Collection (visible to all users)</span>
                  </label>
                </div>
              </div>
            )}

            {movieArray.length > 0 && (
              <div className="field">
                <label className="label">Movies Added (ordered)</label>
                <div>
                  {movieArray.map((movie, index) => (
                    <article key={movie.id ?? index} className="movie-card media box mb-2">
                      {movie.poster_path && (
                        <figure className="media-left">
                          <p className="poster image movie-thumb">
                            <img src={tmdbImage(movie.poster_path, 'w200')} alt={movie.title} />
                          </p>
                        </figure>
                      )}

                      <div className="media-content">
                        <p
                          className="is-size-6 mb-1"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>
                            <strong>
                              {index + 1}. {movie.title}
                            </strong>{' '}
                            <small className="has-text-grey">
                              {movie.release_date?.slice(0, 4) || 'N/A'}
                            </small>
                          </span>
                          {meetupMovieTmdbIds.has(movie.id) && (
                            <span
                              className="tag"
                              title="Seen in a meetup"
                              aria-label="Seen in a meetup"
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                height: 'auto',
                                background: '#48c78e',
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            >
                              CLUB
                            </span>
                          )}
                        </p>

                        <p className="is-size-7 has-text-grey mb-1">
                          ⭐ {movie.vote_average.toFixed(1)} ({movie.vote_count} votes) Lang:{' '}
                          {movie.original_language.toUpperCase()}
                        </p>

                        <p className="is-size-7 movie-overview">
                          {movie.overview || 'No description available.'}
                        </p>
                      </div>

                      <div
                        className="media-right"
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
                      >
                        <div className="buttons are-small has-addons" style={{ marginBottom: 0 }}>
                          <button
                            type="button"
                            className="button"
                            onClick={() => moveMovie(index, -1)}
                            disabled={index === 0}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="button"
                            onClick={() => moveMovie(index, 1)}
                            disabled={index === movieArray.length - 1}
                          >
                            Down
                          </button>
                        </div>
                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            setMovieArray((prev) => prev.filter((_, i) => i !== index))
                          }
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {showErrors && !hasMovies && <p className="help is-danger">Add at least one movie.</p>}
          </form>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-success" onClick={handleSubmit} disabled={!isValid}>
            {mode === 'edit' ? 'Save Changes' : 'Create Collection'}
          </button>
          <button className="button" onClick={handleModalClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}
