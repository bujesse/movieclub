'use client'

import { useEffect, useState } from 'react'

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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !movie) {
      setNominations([])
      return
    }

    const fetchNominations = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/movies/${movie.tmdbId}/oscars`)
        if (!res.ok) throw new Error('Failed to fetch Oscar details')
        const data = await res.json()
        setNominations(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNominations()
  }, [isOpen, movie])

  if (!isOpen || !movie) return null

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
    const roi = ((profit / movie.budget) * 100)
    const multiplier = movie.revenue / movie.budget

    return { profit, roi, multiplier }
  }

  const metrics = getFinancialMetrics()

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
        <header className="modal-card-head" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <p className="modal-card-title" style={{ flex: '1', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{movie.title}</p>
          <button className="delete" aria-label="close" onClick={onClose} style={{ flexShrink: 0 }} />
        </header>

        <section className="modal-card-body">
          {/* Budget & Box Office */}
          {(formatCurrency(movie.budget) || formatCurrency(movie.revenue)) && (
            <div className="mb-4">
              <h3 className="subtitle is-5 mb-3 has-text-weight-semibold" style={{ color: '#48c78e' }}>Financial Performance</h3>
              <div className="box" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem' }}>
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
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0 0.25rem 0',
                      marginTop: '0.25rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {/* ROI Badge */}
                      <span
                        className={`tag is-medium ${
                          metrics.roi >= 300 ? 'is-success' :
                          metrics.roi >= 100 ? 'is-info' :
                          metrics.roi >= 0 ? 'is-link' :
                          'is-danger'
                        }`}
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 'bold',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        {metrics.roi >= 300 ? '💰🔥 ' :
                         metrics.roi >= 100 ? '💰 ' :
                         metrics.roi >= 0 ? '📈 ' :
                         '📉 '}
                        {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(1)}% ROI
                      </span>

                      {/* Multiplier & Profit */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span className={`tag ${
                          metrics.multiplier >= 4 ? 'is-success is-light' :
                          metrics.multiplier >= 2 ? 'is-info is-light' :
                          metrics.multiplier >= 1 ? 'is-link is-light' :
                          'is-danger is-light'
                        }`}>
                          {metrics.multiplier.toFixed(2)}x return
                        </span>
                        <span className={`tag ${
                          metrics.profit >= 0 ? 'is-success is-light' : 'is-danger is-light'
                        }`}>
                          {metrics.profit >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(metrics.profit))}
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
              <h3 className="subtitle is-5 mb-3 has-text-weight-semibold" style={{ color: '#48c78e' }}>Academy Awards</h3>
              {Object.entries(groupedByClass).length === 0 ? (
                <p className="has-text-grey">No details available.</p>
              ) : (
                Object.entries(groupedByClass).map(([classKey, noms]) => {
                  const categoryWins = noms.filter(n => n.winner).length
                  const categoryNoms = noms.length
                  return (
                  <div key={classKey} className="mb-3">
                    <h4 className="subtitle is-6 has-text-weight-bold mb-2" style={{ color: '#dbdbdb' }}>
                      {classKey}
                      <span className="has-text-weight-normal has-text-grey-light ml-2" style={{ fontSize: '0.85rem' }}>
                        ({categoryNoms} nomination{categoryNoms > 1 ? 's' : ''}, {categoryWins} win{categoryWins > 1 ? 's' : ''})
                      </span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {noms
                        .sort((a, b) => a.ceremony - b.ceremony)
                        .map((nom, idx) => (
                          <div
                            key={idx}
                            className="box"
                            style={{
                              padding: '0.6rem',
                              background: nom.winner
                                ? 'rgba(255, 215, 0, 0.1)'
                                : 'rgba(255, 255, 255, 0.05)',
                              borderLeft: nom.winner ? '3px solid #FFD700' : '3px solid transparent',
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
                                <strong className="is-size-6">
                                  {nom.canonicalCategory}
                                  {nom.winner && ' 🏆'}
                                </strong>
                                {nom.name && (
                                  <p className="is-size-7 has-text-grey-light mb-0">{nom.name}</p>
                                )}
                                {nom.detail && (
                                  <p className="is-size-7 has-text-grey-light mt-1 mb-0">{nom.detail}</p>
                                )}
                              </div>
                              <span className="tag is-dark is-small" style={{ flexShrink: 0 }}>
                                {nom.year} (#{nom.ceremony})
                              </span>
                            </div>
                          </div>
                        ))}
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
