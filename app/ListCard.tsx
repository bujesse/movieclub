'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MovieListAllWithFlags } from './page'
import { tmdbImage } from '../lib/tmdb'
import { GENRES, TmdbCrew } from '../types/tmdb'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from './CurrentUserProvider'
import { useVotes } from './VotesProvider'
import { formatDistanceToNowStrict, format } from 'date-fns'
import { Eye, EyeClosed, RefreshCw, MessageCircle, Star } from 'lucide-react'
import { formatMinutes } from '../lib/helpers'
import CommentModal from './CommentModal'
import MovieInfoModal from './MovieInfoModal'

type ListCardProps = {
  list: MovieListAllWithFlags
  actions: {
    onEdit: (id: number) => void
    onDelete: (id: number) => void
    onToggleSeen: (tmdbId: number, hasSeen: boolean) => void
  }
  display?: {
    isArchiveView?: boolean
    showNominatedBy?: boolean
    initialCommentCount?: number
    hideAdminActions?: boolean
    isLocked?: boolean
    showVoteTags?: boolean
  }
  voting?: {
    onVoteChange: (listId: number, hasVoted: boolean, allTimeScore: number) => void
  }
  nomination?: {
    hasNominated: boolean
    isAlreadyNominated: boolean
    onNominate: (listId: number) => void
    isConfirming: boolean
    isLocked?: boolean
  }
}

export default function ListCard({ list, actions, display, voting, nomination }: ListCardProps) {
  const isArchiveView = display?.isArchiveView ?? false
  const showNominatedBy = display?.showNominatedBy ?? false
  const initialCommentCount = display?.initialCommentCount ?? 0
  const hideAdminActions = display?.hideAdminActions ?? false
  const isLocked = display?.isLocked ?? false
  const showVoteTags = display?.showVoteTags ?? false
  const { user } = useCurrentUser()
  const myEmail = user!.email
  const { canVote } = useVotes()
  const router = useRouter()

  const initialScore = (list.votes ?? []).reduce((a, v) => a + v.value, 0)
  const [score, setScore] = useState(initialScore)
  const [allTimeScore, setAllTimeScore] = useState(list.votesTotal)
  const [hasVoted, setHasVoted] = useState(list.votes.some((v) => v.userId === myEmail))
  const [pending, setPending] = useState(false)
  const [areYouSure, setAreYouSure] = useState(false)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [selectedMovieForOscar, setSelectedMovieForOscar] = useState<any | null>(null)
  const wasCreatedByMe = list.createdBy === myEmail
  const totalRunTime = list.movies.reduce(
    (acc, m) => acc + (m.runtime && m.runtime > 0 ? m.runtime : 0),
    0
  )

  // Genres (deduped across movies)
  const genreIds = new Set<number>()
  list.movies.forEach((m) => ((m.genres as number[]) ?? []).forEach((g) => genreIds.add(g)))

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
      if (typeof data.score === 'number') {
        setScore(data.score)
        setAllTimeScore(data.allTimeScore)
      }
      // Notify parent component of vote change
      voting?.onVoteChange?.(list.id, data.hasVoted, data.allTimeScore)
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
      if (!res.ok) {
        if (res.status === 400) {
          const data = await res.json()
          alert(data.error || 'Cannot delete list')
        }
        return
      }
      actions.onDelete(list.id)
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
          <span
            className={`has-text-weight-medium ${
              showNominatedBy &&
              (list as any).nominations?.some((n: any) => n.userId === list.createdBy)
                ? 'has-text-warning'
                : ''
            }`}
          >
            {showNominatedBy &&
            (list as any).nominations?.some((n: any) => n.userId === list.createdBy)
              ? '★ '
              : ''}
            {list.createdBy.split('@')[0]}
          </span>
          <p className="is-size-7 has-text-grey mb-0">
            {isArchiveView
              ? 'Created: ' + format(new Date(list.createdAt), 'MMM d, yyyy')
              : formatDistanceToNowStrict(new Date(list.createdAt), { addSuffix: true })}
          </p>
          {showNominatedBy &&
            (list as any).nominations?.length > 0 &&
            (list as any).nominations.filter((n: any) => n.userId !== list.createdBy).length >
              0 && (
              <p className="is-size-7 has-text-warning mb-0">
                ★{' '}
                {(list as any).nominations
                  .filter((n: any) => n.userId !== list.createdBy)
                  .map((n: any) => n.userId.split('@')[0])
                  .join(', ')}
              </p>
            )}
          {isArchiveView && (list as any).Meetup?.date && (
            <p className="is-size-7 has-text-info mb-0">
              Meetup: {format(new Date((list as any).Meetup.date), 'MMM d, yyyy')}
            </p>
          )}
          {totalRunTime > 0 && <span>{formatMinutes(totalRunTime)}</span>}
        </div>
      </header>

      <MovieList
        list={list}
        onToggleSeenAction={actions.onToggleSeen}
        isArchiveView={isArchiveView}
        showVoteTags={showVoteTags}
        showWatchedBadge={!isArchiveView}
        score={score}
        allTimeScore={allTimeScore}
      />

      <footer className="card-footer">
        {!isArchiveView && !nomination && (
          <>
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
              <span className="ml-2 has-text-grey-light">({allTimeScore})</span>
              {hasVoted && <span className="ml-2 is-size-7 has-text-success">Voted</span>}
            </button>
          </>
        )}
        {nomination && (
          <button
            className={`card-footer-item button is-light `}
            onClick={() => nomination.onNominate(list.id)}
            disabled={
              pending ||
              (nomination.isAlreadyNominated && !nomination.hasNominated) ||
              nomination.isLocked
            }
            title={
              nomination.isLocked
                ? 'Locked - other users have voted for this nomination'
                : nomination.hasNominated
                  ? 'Remove nomination'
                  : nomination.isAlreadyNominated
                    ? 'Already nominated by someone else'
                    : 'Nominate for next meetup'
            }
          >
            <span className="icon is-small" aria-hidden>
              {nomination.hasNominated || nomination.isAlreadyNominated ? (
                <Star size={16} fill="#2d2f3b" />
              ) : (
                <Star size={16} />
              )}
            </span>
            <span>
              {nomination.isConfirming
                ? 'Change?'
                : nomination.hasNominated || nomination.isAlreadyNominated
                  ? 'Nominated'
                  : 'Nominate'}
            </span>
          </button>
        )}
        <button
          className="card-footer-item button is-light"
          onClick={() => setIsCommentModalOpen(true)}
          title="Comments"
        >
          <span className="icon is-small">
            <MessageCircle size={16} />
          </span>
          <span className="ml-2">{commentCount}</span>
        </button>
        {!isArchiveView && !hideAdminActions && wasCreatedByMe && (
          <>
            <button
              className="card-footer-item button has-text-link"
              onClick={() => actions.onEdit(list.id)}
              disabled={pending}
            >
              Edit
            </button>
            <button
              className="card-footer-item button has-text-danger"
              onClick={handleDelete}
              disabled={pending || isLocked}
              title={isLocked ? 'Cannot delete - other users have voted for this nomination' : ''}
            >
              {areYouSure ? 'Are you sure?' : 'Delete'}
            </button>
          </>
        )}
      </footer>

      <CommentModal
        isOpen={isCommentModalOpen}
        listId={list.id}
        listTitle={list.title}
        onClose={() => {
          setIsCommentModalOpen(false)
          // Refresh comment count when modal closes
          fetch(`/api/lists/${list.id}/comments`)
            .then((res) => res.json())
            .then((comments) => setCommentCount(comments.length))
            .catch(console.error)
        }}
      />

      <MovieInfoModal
        isOpen={selectedMovieForOscar !== null}
        movie={selectedMovieForOscar}
        onClose={() => setSelectedMovieForOscar(null)}
      />
    </div>
  )
}

export function MovieList({
  list,
  onToggleSeenAction,
  isArchiveView = false,
  showVoteTags = false,
  showWatchedBadge = true,
  score,
  allTimeScore,
}: {
  list: MovieListAllWithFlags
  onToggleSeenAction: (tmdbId: number, hasSeen: boolean) => void
  isArchiveView?: boolean
  showVoteTags?: boolean
  showWatchedBadge?: boolean
  score?: number
  allTimeScore?: number | string
}) {
  const router = useRouter()
  const [selectedMovieForOscar, setSelectedMovieForOscar] = useState<any | null>(null)

  const { isAdminMode } = useCurrentUser()

  // Count genres across all movies
  const genreCounts = new Map<number, number>()
  list.movies.forEach((m) => {
    return (m.genres as number[]).forEach((g) => {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
    })
  })

  // Sort by frequency (desc), then map to names
  const genres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1]) // sort by count
    .map(([id]) => GENRES[id])
    .filter(Boolean)
    .slice(0, 6)

  const handleSeenClick = async (e: React.MouseEvent, tmdbId: number, hasSeen: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/movies/${tmdbId}/seen`, { method: hasSeen ? 'DELETE' : 'POST' })
    onToggleSeenAction && onToggleSeenAction(tmdbId, hasSeen)
    router.refresh()
  }

  const handleRefreshClick = async (e: React.MouseEvent, tmdbId: number) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/movies/${tmdbId}/updateDetails`, { method: 'POST' })
    router.refresh()
  }

  return (
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
          {(isArchiveView || showVoteTags) && score !== undefined && allTimeScore !== undefined && (
            <div className="mt-3 has-text-centered">
              <span className="tag is-success" title="Votes received (all-time total)">
                {score} ({allTimeScore}) {score === 1 ? 'vote' : 'votes'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="column is-full-mobile">
          {/* Movie List */}
          <div className="content movie-list">
            {list.movies.map((m, i) => (
              <div key={(m.id ?? i) as React.Key} className="movie-item">
                <div
                  className="movie-link"
                  role="button"
                  tabIndex={0}
                  title="View movie details"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedMovieForOscar(m)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="movie-text">
                    <div
                      className="movie-title"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong>{m.title}</strong>

                      {/* Oscar Badges */}
                      {(m.oscarNominations > 0 || m.oscarWins > 0) && (
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          {m.oscarWins > 0 && (
                            <span
                              className="tag is-warning is-light"
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                height: 'auto',
                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                color: '#1a1a1a',
                                fontWeight: 'bold',
                              }}
                              title={`${m.oscarWins} Oscar win${m.oscarWins > 1 ? 's' : ''}`}
                            >
                              🏆 {m.oscarWins}
                            </span>
                          )}
                          {m.oscarNominations > m.oscarWins && (
                            <span
                              className="tag is-light"
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.4rem',
                                height: 'auto',
                                background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
                                color: '#1a1a1a',
                                fontWeight: 'bold',
                              }}
                              title={`${m.oscarNominations - m.oscarWins} nomination${m.oscarNominations - m.oscarWins > 1 ? 's' : ''}`}
                            >
                              ⭐ {m.oscarNominations - m.oscarWins}
                            </span>
                          )}
                        </div>
                      )}

                      {showWatchedBadge && m.inMeetup && (
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
                          ✓ Watched
                        </span>
                      )}

                      {m.inMultipleLists && (
                        <span
                          title="This movie appears in multiple lists"
                          aria-label="In multiple lists"
                        >
                          🔥
                        </span>
                      )}
                    </div>
                    <div className="movie-meta">
                      {m.releaseDate && <span>{new Date(m.releaseDate).getFullYear()}</span>}
                      {m.directors && (m.directors as Array<TmdbCrew>).length > 0 && (
                        <span> • </span>
                      )}
                      {m.directors && (m.directors as Array<TmdbCrew>).length > 0 && (
                        <span>
                          {(m.directors as Array<TmdbCrew>).map((d) => d.name).join(', ')}
                        </span>
                      )}
                      {m.runtime && m.runtime > 0 && <div>{formatMinutes(m.runtime)}</div>}
                    </div>
                  </div>
                </div>
                <div
                  className="movie-actions"
                  style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                >
                  {/* Seen Icon */}
                  <div
                    onClick={(e) => handleSeenClick(e, m.tmdbId, m.hasSeen)}
                    className={`seen is-size-7 ${m.hasSeen ? 'has-text-success' : 'has-text-grey-light'}`}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span className={`is-size-7`}>{m.seenCount}</span>
                    {m.hasSeen ? <Eye /> : <EyeClosed />}
                  </div>

                  {isAdminMode && (
                    <RefreshCw
                      onClick={(e) => handleRefreshClick(e, m.tmdbId)}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <style jsx>{`
            .movie-item {
              padding: 0;
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

            .movie-link {
              padding: 0.6rem 0.75rem;
              flex: 1;
              padding-right: 0.75rem;
              display: block;
            }

            .movie-link:hover {
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

            .movie-link:hover .movie-meta {
              color: #ddd;
            }

            .seen {
              display: flex;
              flex-direction: column;
              align-items: center;
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

      <MovieInfoModal
        isOpen={selectedMovieForOscar !== null}
        movie={selectedMovieForOscar}
        onClose={() => setSelectedMovieForOscar(null)}
      />
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

  const handleClick = () => {
    if (posters.length <= 1) return

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }

    setIdx((i) => (i + 1) % posters.length)

    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % posters.length)
    }, intervalMs)
  }

  // Own aspect ratio: 2:3 via padding-bottom trick.
  return (
    <div
      className="poster-carousel"
      aria-live="polite"
      onClick={handleClick}
      style={{ cursor: posters.length > 1 ? 'pointer' : 'default' }}
      title={posters.length > 1 ? 'Click to see next poster' : undefined}
    >
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
