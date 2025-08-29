'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MovieListAll } from './page'
import { tmdbImage } from '../lib/tmdb'
import { GENRES } from '../types/tmdb'

export default function ListCard({ list }: { list: MovieListAll }) {
  const score = (list.votes ?? []).reduce((a, v) => a + v.value, 0)

  // Genres (deduped across movies)
  const genreIds = new Set<number>()
  list.movies.forEach((m) => (m.genres ?? []).forEach((g) => genreIds.add(g)))
  const genres = Array.from(genreIds)
    .map((id) => GENRES[id])
    .filter(Boolean)
    .slice(0, 5)

  // Show a few titles, not the whole list
  const top = list.movies.slice(0, 6)

  const handleUpvote = () => {
    console.log('Upvote list', list.id)
  }

  const handleDelete = () => {
    console.log('Delete list', list.id)
  }

  return (
    <div
      className="card"
      style={{
        minWidth: '300px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column', // flex column to make footer stick to bottom when content is long
      }}
    >
      <header className="card-header">
        <p className="card-header-title">
          {list.title}
          <span className="tag is-info is-light ml-2">Votes: {score}</span>
        </p>
        <div className="card-header-icon is-size-7 has-text-grey pr-3">
          <span className="has-text-weight-medium">{list.createdBy}</span>
        </div>
      </header>

      <div
        className="card-content"
        style={{
          flex: '1 1 auto', // auto here refers to filling remaining space with buttons
          minHeight: 0, // prevents overflow issues in some browsers
        }}
      >
        <div className="columns is-variable is-4 is-align-items-start is-multiline">
          {/* Left: Poster carousel */}
          <div className="column is-full-mobile is-narrow has-text-centered-mobile">
            <PosterCarousel movies={list.movies} intervalMs={5000} />
          </div>

          {/* Right: Details */}
          <div className="column is-full-mobile">
            {/* Movie List */}
            <div className="content movie-list">
              {top.map((m, i) => (
                <div
                  key={(m.id ?? i) as React.Key}
                  className="movie-item"
                  role="button"
                  tabIndex={0}
                >
                  <div className="movie-text">
                    <div className="movie-title">
                      <strong>{m.title}</strong>
                    </div>
                    {m.releaseDate && (
                      <div className="movie-meta">{new Date(m.releaseDate).getFullYear()}</div>
                    )}
                  </div>
                  <span className="movie-chevron">›</span>
                </div>
              ))}
            </div>
            <style jsx>{`
              .movie-item {
                padding: 0.6rem 0.75rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                transition: background 0.2s;
              }

              .movie-item:last-child {
                border-bottom: none;
              }

              .movie-item:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
              }

              .movie-text {
                display: flex;
                flex-direction: column;
                gap: 0.2rem;
              }

              .movie-title {
                font-weight: 600;
              }

              .movie-meta {
                font-size: 0.8rem;
                color: #aaa;
              }

              .movie-item:hover .movie-meta {
                color: #ddd;
              }

              .movie-chevron {
                font-size: 1.2rem;
                color: #888;
                margin-left: 1rem;
                transition: color 0.2s;
              }

              .movie-item:hover .movie-chevron {
                color: #fff;
              }
            `}</style>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="tags mb-3 is-justify-content-center is-align-items-center is-flex-mobile">
                {genres.map((g) => (
                  <span key={g} className="tag is-dark">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="card-footer">
        <button className="card-footer-item button" onClick={handleUpvote}>
          ▲ Upvote
        </button>
        <button
          className="card-footer-item button has-text-danger"
          onClick={handleDelete}
          disabled={false}
        >
          Delete
        </button>
      </footer>
    </div>
  )
}

/** --- Fade carousel for posters --- */
function PosterCarousel({
  movies,
  intervalMs = 5000,
}: {
  movies: Array<{ title?: string | null; posterPath?: string | null }>
  width?: number
  intervalMs?: number
}) {
  const posters = useMemo(() => {
    const seen = new Set<string>()
    const list = movies
      .map((m) => {
        const url = tmdbImage(m.posterPath, 'w300')
        return url ? { url, alt: m.title ?? 'Poster' } : null
      })
      .filter((x): x is { url: string; alt: string } => !!x)
      .filter(({ url }) => (seen.has(url) ? false : (seen.add(url), true)))

    return list.length > 0 ? list : [{ url: '', alt: 'Poster' }] // keep length > 0
  }, [movies])

  const [idx, setIdx] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (posters.length <= 1) return

    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % posters.length)
    }, intervalMs)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [posters.length, intervalMs])

  useEffect(() => {
    posters.forEach(({ url }) => {
      if (!url) return
      const img = new Image()
      img.src = url
    })
  }, [posters])

  // Own aspect ratio: 2:3 via padding-bottom trick.
  return (
    <div className="poster-carousel" aria-live="polite">
      {posters.map((p, i) => {
        const active = i === idx
        return (
          <img
            key={`${p.url || 'placeholder'}-${i}`}
            src={p.url || undefined}
            alt={p.alt}
            loading={i === 0 ? 'eager' : 'lazy'}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: active && p.url ? 1 : 0,
              transform: active ? 'scale(1.0)' : 'scale(1.02)',
              transition: 'opacity 600ms ease, transform 600ms ease',
              willChange: 'opacity, transform',
              display: p.url ? 'block' : 'none',
            }}
          />
        )
      })}
      {/* Drop-in scoped CSS */}
      <style jsx>{`
        .poster-carousel {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          margin: 0 auto;
          background: #111;
          aspect-ratio: 2 / 3;
          /* mobile/tablet: fluid */
          width: clamp(140px, 60vw, 260px);
        }
        @media (min-width: 1024px) {
          /* desktop: compact */
          .poster-carousel {
            width: 160px;
          }
        }
      `}</style>
    </div>
  )
}
