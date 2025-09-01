'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MovieListAllWithFlags } from './page'
import { tmdbImage } from '../lib/tmdb'
import { GENRES } from '../types/tmdb'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from './CurrentUserProvider'
import { useVotes } from './VotesProvider'
import { formatDistanceToNowStrict } from 'date-fns'

export default function ListCard({
  list,
  onEdit,
  onDelete,
}: {
  list: MovieListAllWithFlags
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}) {
  const me = useCurrentUser()
  const myEmail = me!.email
  const { canVote } = useVotes()
  const router = useRouter()

  const initialScore = (list.votes ?? []).reduce((a, v) => a + v.value, 0)
  const [score, setScore] = useState(initialScore)
  const [hasVoted, setHasVoted] = useState(list.votes.some((v) => v.userId === myEmail))
  const [pending, setPending] = useState(false)
  const [areYouSure, setAreYouSure] = useState(false)
  const wasCreatedByMe = list.createdBy === myEmail

  // Genres (deduped across movies)
  const genreIds = new Set<number>()
  list.movies.forEach((m) => ((m.genres as number[]) ?? []).forEach((g) => genreIds.add(g)))
  const genres = Array.from(genreIds)
    .map((id) => GENRES[id])
    .filter(Boolean)
    .slice(0, 5)

  // Show a few titles, not the whole list
  const top = list.movies.slice(0, 6)

  const handleUpvote = async () => {
    if (pending) return
    setPending(true)
    try {
      const method = hasVoted ? 'DELETE' : 'POST'
      const res = await fetch(`/api/lists/${list.id}/vote`, { method })
      if (res.status === 401) {
        // TODO: redirect to your Access-protected login page
        // router.push("/login")
        return
      }
      if (!res.ok) return
      const data = await res.json()
      setHasVoted(data.hasVoted)
      if (typeof data.score === 'number') setScore(data.score)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async () => {
    if (!areYouSure) {
      setAreYouSure(true)
      setTimeout(() => setAreYouSure(false), 3000)
      return
    }
    setPending(true)
    try {
      const res = await fetch(`/api/lists/${list.id}`, { method: 'DELETE' })
      if (res.status === 401) {
        // TODO: redirect to your Access-protected login page
        // router.push("/login")
        return
      }
      if (!res.ok) return
      onDelete(list.id)
      router.refresh()
    } finally {
      setPending(false)
    }
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
        <p className="card-header-title">{list.title}</p>
        <div
          className="card-header-icon is-size-7 has-text-grey pr-3"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            minWidth: '115px',
          }}
        >
          <span className="has-text-weight-medium">{list.createdBy.split('@')[0]}</span>
          <p className="is-size-7 has-text-grey mb-0">
            {formatDistanceToNowStrict(new Date(list.createdAt), { addSuffix: true })}
          </p>
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
                <a
                  href={`https://letterboxd.com/tmdb/${m.tmdbId}`}
                  target="_blank"
                  key={(m.id ?? i) as React.Key}
                  className="movie-item"
                  role="button"
                  tabIndex={0}
                  title="View on Letterboxd"
                >
                  <div className="movie-text">
                    <div className="movie-title">
                      <strong>{m.title}</strong>
                      {m.inMultipleLists && (
                        <span
                          title="This movie appears in multiple lists"
                          aria-label="In multiple lists"
                        >
                          🔥
                        </span>
                      )}
                    </div>
                    {m.releaseDate && (
                      <div className="movie-meta">{new Date(m.releaseDate).getFullYear()}</div>
                    )}
                  </div>
                  <span className="movie-chevron">›</span>
                </a>
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
        {list.description && (
          <p
            id="list-description"
            className="list-description mt-3 has-text-grey-light is-size-7 has-text-centered"
            title={list.description}
          >
            {list.description}
          </p>
        )}
      </div>

      <footer className="card-footer">
        <button
          className={`card-footer-item button ${hasVoted ? 'is-success is-light' : 'is-light'}`}
          onClick={handleUpvote}
          disabled={pending || (!hasVoted && !canVote)}
          aria-pressed={hasVoted}
          title={hasVoted ? 'You voted for this' : !canVote ? 'No votes left' : 'Upvote'}
        >
          <span className="icon is-small" aria-hidden>
            <span>{hasVoted ? '▲' : '△'}</span>
          </span>
          <span className="ml-2 has-text-weight-semibold">{score}</span>
          {hasVoted && <span className="ml-2 is-size-7 has-text-success">Voted</span>}
        </button>
        {wasCreatedByMe && (
          <>
            <button
              className="card-footer-item button has-text-link"
              onClick={() => onEdit(list.id)}
              disabled={pending}
            >
              Edit
            </button>
            <button
              className="card-footer-item button has-text-danger"
              onClick={handleDelete}
              disabled={pending}
            >
              {areYouSure ? 'Are you sure?' : 'Delete'}
            </button>
          </>
        )}
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
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<number | null>(null)

  const posters = useMemo(() => {
    const seen = new Set<string>()
    const list = movies
      .map((m) => {
        const url = tmdbImage(m.posterPath, 'w300')
        return url ? { url, alt: m.title ?? 'Poster' } : null
      })
      .filter((x): x is { url: string; alt: string } => !!x)
      .filter(({ url }) => (seen.has(url) ? false : (seen.add(url), true)))

    setIdx(0)
    return list
  }, [movies])

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
