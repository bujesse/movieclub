'use client'

import { useState, useEffect } from 'react'
import Autocomplete from './Autocomplete'
import { searchTmdb } from '../lib/tmdb'
import type { TmdbMovie } from '../types/tmdb'
import { tmdbImage } from '../lib/tmdb'
import { useCurrentUser } from './CurrentUserProvider'
import type { MovieListAll } from './page'

export default function ListModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialList,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: any) => void
  mode?: 'create' | 'edit'
  initialList?: MovieListAll
}) {
  const me = useCurrentUser()
  const myEmail = me!.email
  const [listTitle, setListTitle] = useState('')
  const [description, setDescription] = useState('')
  const [movieInput, setMovieInput] = useState('')
  const [movieArray, setMovieArray] = useState<TmdbMovie[]>([])

  const [showErrors, setShowErrors] = useState(false)
  const hasMovies = movieArray.length > 0
  const isValid = listTitle.trim() !== '' && hasMovies

  // Pre-fill when editing (minimal change: keep structure/styling identical)
  useEffect(() => {
    if (mode === 'edit' && initialList) {
      setListTitle(initialList.title)
      setDescription(initialList.description ?? '')
      setMovieArray(
        // @ts-ignore
        initialList.movies.map((m: any) => ({
          id: m.tmdbId ?? m.id,
          title: m.title,
          original_title: m.originalTitle ?? null,
          original_language: m.originalLanguage ?? '',
          release_date:
            typeof m.releaseDate === 'string'
              ? m.releaseDate
              : m.releaseDate
                ? new Date(m.releaseDate).toISOString().slice(0, 10)
                : null,
          overview: m.overview ?? '',
          vote_average: m.voteAverage ?? 0,
          vote_count: m.voteCount ?? 0,
          poster_path: m.posterPath ?? null,
          backdrop_path: m.backdropPath ?? null,
          genre_ids: Array.isArray(m.genres) ? m.genres : [],
        }))
      )
    }
  }, [isOpen])

  const labelFor = (m: TmdbMovie) => `${m.title} (${m.release_date?.slice(0, 4) || 'N/A'})`

  const addMovieToArray = (movie: TmdbMovie) => {
    // prevent dupes by TMDb id
    setMovieArray((prev) => (prev.some((m) => m.id === movie.id) ? prev : [...prev, movie]))
    setMovieInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setShowErrors(true)
      return
    }

    const payload = {
      title: listTitle,
      description,
      createdBy: myEmail,
      movies: movieArray.map((m: any) => ({
        tmdbId: Number(m.id),
        title: m.title,
        originalTitle: m.original_title ?? null,
        originalLanguage: m.original_language ?? null,
        releaseDate: m.release_date ?? null, // string; server will new Date(...)
        overview: m.overview ?? null,
        voteAverage: m.vote_average ?? null,
        voteCount: m.vote_count ?? null,
        posterPath: m.poster_path ?? null, // raw TMDb path like "/abc.jpg"
        backdropPath: m.backdrop_path ?? null,
        genres: Array.isArray(m.genre_ids) ? m.genre_ids : null, // JSON array of ints
      })),
    }

    onSubmit(payload)
    handleModalClose()
  }

  const handleModalClose = () => {
    setListTitle('')
    setMovieArray([])
    setDescription('')
    setMovieInput('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={handleModalClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{mode === 'edit' ? 'Edit List' : 'Create New List'}</p>
          <button className="delete" aria-label="close" onClick={handleModalClose}></button>
        </header>
        <section className="modal-card-body">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="listTitle">
                List Title
              </label>
              <div className="control">
                <input
                  id="listTitle"
                  className="input"
                  type="text"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="description">
                Description
              </label>
              <div className="control">
                <textarea
                  id="description"
                  className="textarea"
                  placeholder="Optional description of your list"
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

            {movieArray.length > 0 && (
              <div className="field">
                {movieArray.length > 0 && (
                  <div className="field">
                    <label className="label">Movies Added</label>
                    <div>
                      {movieArray.map((movie, index) => (
                        <article key={movie.id ?? index} className="movie-card media box mb-2">
                          {/* Poster */}
                          {movie.poster_path && (
                            <figure className="media-left">
                              <p className="poster image movie-thumb">
                                <img src={tmdbImage(movie.poster_path, 'w200')} alt={movie.title} />
                              </p>
                            </figure>
                          )}

                          {/* Main content */}
                          <div className="media-content">
                            <p className="is-size-6 mb-1">
                              <strong>{movie.title}</strong>{' '}
                              <small className="has-text-grey">
                                {movie.release_date?.slice(0, 4) || 'N/A'}
                              </small>
                            </p>

                            {/* Extra info row */}
                            <p className="is-size-7 has-text-grey mb-1">
                              ⭐ {movie.vote_average.toFixed(1)} ({movie.vote_count} votes) Lang:{' '}
                              {movie.original_language.toUpperCase()}
                            </p>

                            {/* Truncated overview */}
                            <p className="is-size-7 movie-overview">
                              {movie.overview || 'No description available.'}
                            </p>
                          </div>

                          {/* Remove button */}
                          <div className="media-right">
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
              </div>
            )}

            {showErrors && !hasMovies && <p className="help is-danger">Add at least one movie.</p>}

            <div className="field is-grouped is-grouped-right mt-4">
              <div className="control">
                <button type="button" className="button" onClick={handleModalClose}>
                  Cancel
                </button>
              </div>
              <div className="control">
                <button type="submit" className="button is-primary">
                  {mode === 'edit' ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
