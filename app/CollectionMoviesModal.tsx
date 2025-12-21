'use client'

import { useState } from 'react'
import { tmdbImage } from '../lib/tmdb'
import { Eye, EyeClosed, X as XIcon } from 'lucide-react'
import MovieInfoModal from './MovieInfoModal'
import { EnrichedCollection } from '../types/collection'

type Movie = EnrichedCollection['movies'][number]

type CollectionMoviesModalProps = {
  isOpen: boolean
  onClose: () => void
  collectionName: string
  movies: Movie[]
  onSeenClick: (e: React.MouseEvent, movie: any) => void
  getSeenState: (tmdbId: number) => { hasSeen: boolean; seenCount: number }
  showOscarBadges?: boolean
  showClubBadge?: boolean
}

type SeenFilter = 'all' | 'seen-by-me' | 'not-seen-by-you' | 'not-seen-by-anyone' | 'in-movie-list'

export default function CollectionMoviesModal({
  isOpen,
  onClose,
  collectionName,
  movies,
  onSeenClick,
  getSeenState,
  showOscarBadges = true,
  showClubBadge = true,
}: CollectionMoviesModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null)
  const [seenFilter, setSeenFilter] = useState<SeenFilter>('all')

  const handleBackgroundClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  if (!isOpen) return null

  // Filter movies by search query and seen filter
  const filteredMovies = movies.filter((m) => {
    // First apply search query filter
    const matchesSearch = m.movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    // Then apply seen filter
    const seenState = getSeenState(m.movie.tmdbId)
    switch (seenFilter) {
      case 'seen-by-me':
        return seenState.hasSeen
      case 'not-seen-by-you':
        return !seenState.hasSeen
      case 'not-seen-by-anyone':
        return seenState.seenCount === 0
      case 'in-movie-list':
        return m.movie.inUnscheduledList
      case 'all':
      default:
        return true
    }
  })

  return (
    <>
      <div className="modal is-active">
        <div
          className="modal-background"
          style={{ cursor: 'default' }}
          onClick={handleBackgroundClick}
        />
        <div
          className="modal-card"
          style={{ width: '90%', maxWidth: '1000px', height: '90%', cursor: 'default' }}
        >
          <header
            className="modal-card-head"
            style={{ padding: '0.4rem 1rem', position: 'relative', zIndex: 1 }}
          >
            <div style={{ flex: 1 }}>
              <p className="modal-card-title">{collectionName}</p>
              <p className="is-size-7 has-text-grey-light" style={{ marginTop: '0.25rem' }}>
                {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
                {searchQuery && ` (filtered from ${movies.length})`}
              </p>
            </div>
            <button
              className="delete"
              aria-label="close"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            ></button>
          </header>

          {/* Movie list with search bar inside */}
          <section
            className="modal-card-body"
            style={{ padding: '0.5rem 1rem 0.25rem', flex: 1, overflowY: 'auto' }}
          >
            {/* Search bar */}
            <div className="field" style={{ marginBottom: '0.5rem' }}>
              <div className="control has-icons-right">
                <input
                  className="input"
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <span
                    className="icon is-right"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <XIcon size={16} />
                  </span>
                )}
              </div>
            </div>

            {/* Seen filter buttons */}
            <div className="buttons has-addons is-centered" style={{ marginBottom: '0.5rem' }}>
              <button
                className={`button is-small ${seenFilter === 'all' ? 'is-info is-selected' : ''}`}
                onClick={() => setSeenFilter('all')}
              >
                All
              </button>
              <button
                className={`button is-small ${seenFilter === 'seen-by-me' ? 'is-info is-selected' : ''}`}
                onClick={() => setSeenFilter('seen-by-me')}
              >
                Seen by me
              </button>
              <button
                className={`button is-small ${seenFilter === 'not-seen-by-you' ? 'is-info is-selected' : ''}`}
                onClick={() => setSeenFilter('not-seen-by-you')}
              >
                Not seen by me
              </button>
              <button
                className={`button is-small ${seenFilter === 'not-seen-by-anyone' ? 'is-info is-selected' : ''}`}
                onClick={() => setSeenFilter('not-seen-by-anyone')}
              >
                Not seen by anyone
              </button>
              <button
                className={`button is-small ${seenFilter === 'in-movie-list' ? 'is-info is-selected' : ''}`}
                onClick={() => setSeenFilter('in-movie-list')}
              >
                In movie list
              </button>
            </div>
            {filteredMovies.length === 0 ? (
              <div className="has-text-centered has-text-grey">No movies found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {filteredMovies.map((m, index) => {
                  const seenState = getSeenState(m.movie.tmdbId)
                  const year = m.movie.releaseDate
                    ? new Date(m.movie.releaseDate).getFullYear()
                    : null

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.3rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedMovie(m.movie)}
                    >
                      {/* Rank number */}
                      <div
                        style={{
                          minWidth: '14px',
                          textAlign: 'right',
                          fontSize: '0.95rem',
                          color: '#666',
                          fontWeight: 500,
                        }}
                      >
                        {m.order + 1}
                      </div>

                      {/* Poster */}
                      <div
                        style={{
                          width: '50px',
                          minWidth: '50px',
                          aspectRatio: '2/3',
                          background: '#111',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={tmdbImage(m.movie.posterPath, 'w200')}
                          alt={m.movie.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Movie info & badges */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {m.movie.title}
                        </div>

                        {/* Year and runtime inline */}
                        {(year || m.movie.runtime) && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#999',
                              marginTop: '0.25rem',
                            }}
                          >
                            {year}
                            {year && m.movie.runtime && ' • '}
                            {m.movie.runtime &&
                              `${Math.floor(m.movie.runtime / 60)}h ${m.movie.runtime % 60}m`}
                          </div>
                        )}

                        {/* Badges */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.25rem',
                            marginTop: '0.25rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {showClubBadge && m.movie.inMeetup && (
                            <span
                              className="tag is-small"
                              style={{
                                background: '#48c78e',
                                color: 'white',
                                fontSize: '0.65rem',
                              }}
                            >
                              CLUB
                            </span>
                          )}
                          {showClubBadge && m.movie.inUnscheduledList && !m.movie.inMeetup && (
                            <span
                              className="tag is-small"
                              style={{
                                background: '#3e8ed0',
                                color: 'white',
                                fontSize: '0.65rem',
                              }}
                              title="In a list with no meetup yet"
                            >
                              IN LIST
                            </span>
                          )}
                          {showOscarBadges && m.movie.oscarWins > 0 && (
                            <span
                              className="tag is-small"
                              style={{
                                background: '#f7d794',
                                color: '#333',
                                fontSize: '0.65rem',
                              }}
                              title={`${m.movie.oscarWins} Oscar win${m.movie.oscarWins > 1 ? 's' : ''}`}
                            >
                              🏆 {m.movie.oscarWins}
                            </span>
                          )}
                          {showOscarBadges &&
                            m.movie.oscarNominations > 0 &&
                            m.movie.oscarWins === 0 && (
                              <span
                                className="tag is-small"
                                style={{
                                  background: '#dfe6e9',
                                  color: '#333',
                                  fontSize: '0.65rem',
                                }}
                                title={`${m.movie.oscarNominations} Oscar nomination${
                                  m.movie.oscarNominations > 1 ? 's' : ''
                                }`}
                              >
                                ⭐ {m.movie.oscarNominations}
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Seen toggle */}
                      <div
                        onClick={(e) => onSeenClick(e, m.movie)}
                        className={`seen is-size-7 ${seenState.hasSeen ? 'has-text-success' : 'has-text-grey-light'}`}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.15rem',
                          padding: '0.5rem',
                          minWidth: '50px',
                        }}
                        title={seenState.hasSeen ? 'Mark as unseen' : 'Mark as seen'}
                      >
                        <span className="is-size-7" style={{ fontWeight: 500 }}>
                          {seenState.seenCount}
                        </span>
                        {seenState.hasSeen ? <Eye size={16} /> : <EyeClosed size={16} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <footer
            className="modal-card-foot"
            style={{
              justifyContent: 'flex-end',
              padding: '0.4rem 1rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <button
              className="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              Close
            </button>
          </footer>
        </div>
      </div>

      <MovieInfoModal
        isOpen={selectedMovie !== null}
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </>
  )
}
