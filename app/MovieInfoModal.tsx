'use client'

import { useEffect, useState } from 'react'
import { GENRES } from '../types/tmdb'

interface OscarNomination {
  ceremony: number
  year: string
  class: string
  category: string
  canonicalCategory: string
  name: string | null
  winner: boolean
  detail: string | null
}

interface MovieInfoModalProps {
  isOpen: boolean
  movie: {
    tmdbId: number
    title: string
    oscarNominations: number
    oscarWins: number
    oscarCategories: Record<string, { nominations: number; wins: number }> | null
    budget?: number | null
    revenue?: number | null
  } | null
  onClose: () => void
}

export default function MovieInfoModal({ isOpen, movie, onClose }: MovieInfoModalProps) {
  const [nominations, setNominations] = useState<OscarNomination[]>([])
  const [releaseDate, setReleaseDate] = useState<string | null>(null)
  const [runtime, setRuntime] = useState<number | null>(null)
  const [directors, setDirectors] = useState<any>(null)
  const [actors, setActors] = useState<any>(null)
  const [genres, setGenres] = useState<any>(null)
  const [voteAverage, setVoteAverage] = useState<number | null>(null)
  const [voteCount, setVoteCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewingCeremony, setViewingCeremony] = useState<{
    ceremony: number
    category: string
  } | null>(null)
  const [winner, setWinner] = useState<{
    name: string | null
    detail: string | null
    film: string
  } | null>(null)
  const [loadingWinner, setLoadingWinner] = useState(false)

  useEffect(() => {
    if (!isOpen || !movie) {
      setNominations([])
      setReleaseDate(null)
      setRuntime(null)
      setDirectors(null)
      setActors(null)
      setGenres(null)
      setVoteAverage(null)
      setVoteCount(null)
      setViewingCeremony(null)
      return
    }

    const fetchNominations = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/movies/${movie.tmdbId}/oscars`)
        if (!res.ok) throw new Error('Failed to fetch Oscar details')
        const data = await res.json()
        setNominations(data.nominations || data)
        setReleaseDate(data.releaseDate || null)
        setRuntime(data.runtime || null)
        setDirectors(data.directors || null)
        setActors(data.actors || null)
        setGenres(data.genres || null)
        setVoteAverage(data.voteAverage || null)
        setVoteCount(data.voteCount || null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNominations()
  }, [isOpen, movie])

  if (!isOpen || !movie) return null

  // Fetch winner for a specific ceremony and category
  const fetchWinner = async (ceremony: number, category: string) => {
    if (viewingCeremony?.ceremony === ceremony && viewingCeremony?.category === category) {
      setViewingCeremony(null)
      setWinner(null)
      return
    }

    setLoadingWinner(true)
    setViewingCeremony({ ceremony, category })
    try {
      const res = await fetch(
        `/api/oscars/ceremony/${ceremony}/category/${encodeURIComponent(category)}`
      )
      if (!res.ok) throw new Error('Failed to fetch winner')
      const data = await res.json()
      setWinner(data)
    } catch (err) {
      console.error(err)
      setWinner(null)
    } finally {
      setLoadingWinner(false)
    }
  }

  // Helper to format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount || amount === 0) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate profit/loss metrics
  const getFinancialMetrics = () => {
    if (!movie.budget || !movie.revenue || movie.budget === 0) return null

    const profit = movie.revenue - movie.budget
    const roi = (profit / movie.budget) * 100
    const multiplier = movie.revenue / movie.budget

    return { profit, roi, multiplier }
  }

  const metrics = getFinancialMetrics()

  // Extract year from releaseDate
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null

  // Group nominations by category class
  const groupedByClass: Record<string, OscarNomination[]> = {}
  nominations.forEach((nom) => {
    if (!groupedByClass[nom.class]) {
      groupedByClass[nom.class] = []
    }
    groupedByClass[nom.class].push(nom)
  })

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose} />
      <div className="modal-card" style={{ maxWidth: '700px' }}>
        <header
          className="modal-card-head"
          style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}
        >
          <p
            className="modal-card-title"
            style={{ flex: '1', wordWrap: 'break-word', overflowWrap: 'break-word' }}
          >
            {movie.title}
            {year && ` (${year})`}
          </p>
          <button
            className="delete"
            aria-label="close"
            onClick={onClose}
            style={{ flexShrink: 0 }}
          />
        </header>

        <section className="modal-card-body">
          {/* Basic Info */}
          {(runtime || directors || actors || genres || voteAverage) && (
            <div className="mb-4">
              <h3
                className="subtitle is-5 mb-3 has-text-weight-semibold"
                style={{ color: '#48c78e' }}
              >
                Info
              </h3>
              <div
                className="box"
                style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Runtime */}
                  {runtime && (
                    <div>
                      <span className="has-text-grey-light">Runtime:</span>{' '}
                      <strong>{Math.floor(runtime / 60)}h {runtime % 60}m</strong>
                    </div>
                  )}

                  {/* Directors */}
                  {directors && Array.isArray(directors) && directors.length > 0 && (
                    <div>
                      <span className="has-text-grey-light">
                        {directors.length > 1 ? 'Directors:' : 'Director:'}
                      </span>{' '}
                      <strong>{directors.map((d: any) => d.name).join(', ')}</strong>
                    </div>
                  )}

                  {/* Cast */}
                  {actors && Array.isArray(actors) && actors.length > 0 && (
                    <div>
                      <span className="has-text-grey-light">Cast:</span>{' '}
                      <strong>{actors.slice(0, 5).map((a: any) => a.name).join(', ')}</strong>
                    </div>
                  )}

                  {/* Genres */}
                  {genres && Array.isArray(genres) && genres.length > 0 && (
                    <div>
                      <span className="has-text-grey-light">Genres:</span>{' '}
                      <strong>
                        {genres.map((g: number) => GENRES[g]).filter(Boolean).join(', ')}
                      </strong>
                    </div>
                  )}

                  {/* TMDB Rating */}
                  {voteAverage && (
                    <div>
                      <span className="has-text-grey-light">TMDB Rating:</span>{' '}
                      <strong>⭐ {voteAverage.toFixed(1)}/10</strong>
                      {voteCount && (
                        <span className="has-text-grey-light">
                          {' '}({voteCount.toLocaleString()} votes)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Budget & Box Office */}
          {(formatCurrency(movie.budget) || formatCurrency(movie.revenue)) && (
            <div className="mb-4">
              <h3
                className="subtitle is-5 mb-3 has-text-weight-semibold"
                style={{ color: '#48c78e' }}
              >
                Financial Performance
              </h3>
              <div
                className="box"
                style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Budget */}
                  {formatCurrency(movie.budget) && (
                    <div>
                      <span className="has-text-grey-light">Budget:</span>{' '}
                      <strong className="is-size-5">{formatCurrency(movie.budget)}</strong>
                    </div>
                  )}

                  {/* Box Office */}
                  {formatCurrency(movie.revenue) && (
                    <div>
                      <span className="has-text-grey-light">Box Office:</span>{' '}
                      <strong className="is-size-5">{formatCurrency(movie.revenue)}</strong>
                    </div>
                  )}

                  {/* Profit/Loss Metrics */}
                  {metrics && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0 0.25rem 0',
                        marginTop: '0.25rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {/* ROI Badge */}
                      <span
                        className={`tag is-medium ${
                          metrics.roi >= 300
                            ? 'is-success'
                            : metrics.roi >= 100
                              ? 'is-info'
                              : metrics.roi >= 0
                                ? 'is-link'
                                : 'is-danger'
                        }`}
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          padding: '0.5rem 1rem',
                        }}
                      >
                        {metrics.roi >= 300
                          ? '💰🔥 '
                          : metrics.roi >= 100
                            ? '💰 '
                            : metrics.roi >= 0
                              ? '📈 '
                              : '📉 '}
                        {metrics.roi >= 0 ? '+' : ''}
                        {metrics.roi.toFixed(1)}% ROI
                      </span>

                      {/* Multiplier & Profit */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.4rem',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          className={`tag ${
                            metrics.multiplier >= 4
                              ? 'is-success is-light'
                              : metrics.multiplier >= 2
                                ? 'is-info is-light'
                                : metrics.multiplier >= 1
                                  ? 'is-link is-light'
                                  : 'is-danger is-light'
                          }`}
                        >
                          {metrics.multiplier.toFixed(2)}x return
                        </span>
                        <span
                          className={`tag ${
                            metrics.profit >= 0 ? 'is-success is-light' : 'is-danger is-light'
                          }`}
                        >
                          {metrics.profit >= 0 ? '↑' : '↓'}{' '}
                          {formatCurrency(Math.abs(metrics.profit))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="has-text-centered">Loading details...</p>
          ) : movie.oscarNominations === 0 && movie.oscarWins === 0 ? (
            <div className="has-text-centered has-text-grey">
              <p>No Academy Award nominations or wins for this movie.</p>
            </div>
          ) : (
            <div>
              {/* Awards */}
              <h3
                className="subtitle is-5 mb-3 has-text-weight-semibold"
                style={{ color: '#48c78e' }}
              >
                Academy Awards
              </h3>
              {Object.entries(groupedByClass).length === 0 ? (
                <p className="has-text-grey">No details available.</p>
              ) : (
                Object.entries(groupedByClass).map(([classKey, noms]) => {
                  const categoryWins = noms.filter((n) => n.winner).length
                  const categoryNoms = noms.length
                  return (
                    <div key={classKey} className="mb-3">
                      <h4
                        className="subtitle is-6 has-text-weight-bold mb-2"
                        style={{ color: '#dbdbdb' }}
                      >
                        {classKey}
                        <span
                          className="has-text-weight-normal has-text-grey-light ml-2"
                          style={{ fontSize: '0.85rem' }}
                        >
                          ({categoryNoms} nomination{categoryNoms > 1 ? 's' : ''}, {categoryWins}{' '}
                          win{categoryWins > 1 ? 's' : ''})
                        </span>
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {noms
                          .sort((a, b) => a.ceremony - b.ceremony)
                          .map((nom, idx) => {
                            const isViewing =
                              viewingCeremony?.ceremony === nom.ceremony &&
                              viewingCeremony?.category === nom.canonicalCategory
                            return (
                              <div key={idx}>
                                <div
                                  className="box"
                                  style={{
                                    padding: '0.6rem',
                                    background: nom.winner
                                      ? 'rgba(255, 215, 0, 0.1)'
                                      : 'rgba(255, 255, 255, 0.05)',
                                    borderLeft: nom.winner
                                      ? '3px solid #FFD700'
                                      : '3px solid transparent',
                                    marginBottom: isViewing ? '.5rem' : undefined,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'start',
                                      gap: '0.5rem',
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <strong
                                        className="is-size-6"
                                        {...(!nom.winner && {
                                          onClick: () =>
                                            fetchWinner(nom.ceremony, nom.canonicalCategory),
                                          style: {
                                            cursor: 'pointer',
                                            textDecoration: 'underline dotted',
                                          },
                                          title: 'Click to see winner',
                                        })}
                                      >
                                        {nom.canonicalCategory}
                                        {nom.winner && ' 🏆'}
                                      </strong>
                                      {nom.name && (
                                        <p className="is-size-7 has-text-grey-light mb-0">
                                          {nom.name}
                                        </p>
                                      )}
                                      {nom.detail && (
                                        <p className="is-size-7 has-text-grey-light mt-1 mb-0">
                                          {nom.detail}
                                        </p>
                                      )}
                                    </div>
                                    <span
                                      className="tag is-dark is-small"
                                      {...(!nom.winner && {
                                        onClick: () =>
                                          fetchWinner(nom.ceremony, nom.canonicalCategory),
                                        style: { cursor: 'pointer' },
                                        title: 'Click to see winner',
                                      })}
                                      style={{
                                        flexShrink: 0,
                                        ...(!nom.winner && { cursor: 'pointer' }),
                                      }}
                                    >
                                      {nom.year} (#{nom.ceremony})
                                    </span>
                                  </div>
                                </div>
                                {isViewing && (
                                  <div
                                    className="box"
                                    style={{
                                      padding: '0.5rem',
                                      marginTop: '-0.2rem',
                                      marginBottom: '0',
                                      background: 'rgba(72, 199, 142, 0.1)',
                                      borderLeft: '3px solid #48c78e',
                                    }}
                                  >
                                    {loadingWinner ? (
                                      <p className="is-size-7 has-text-grey-light">
                                        Loading winner...
                                      </p>
                                    ) : winner ? (
                                      <div>
                                        <p
                                          className="is-size-7 has-text-weight-bold"
                                          style={{ color: '#48c78e' }}
                                        >
                                          🏆 Winner: {winner.film}
                                        </p>
                                        {winner.name && (
                                          <p className="is-size-7 has-text-grey-light mb-0">
                                            {winner.name}
                                          </p>
                                        )}
                                        {winner.detail && (
                                          <p className="is-size-7 has-text-grey-light mb-0">
                                            {winner.detail}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="is-size-7 has-text-grey-light">
                                        No winner found
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>

        <footer className="modal-card-foot" style={{ justifyContent: 'space-between' }}>
          <a
            href={`https://letterboxd.com/tmdb/${movie.tmdbId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="button is-link"
          >
            View on Letterboxd
          </a>
          <button className="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
