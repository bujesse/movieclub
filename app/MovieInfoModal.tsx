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
          {loading ? (
            <p className="has-text-centered">Loading details...</p>
          ) : movie.oscarNominations === 0 && movie.oscarWins === 0 ? (
            <div className="has-text-centered has-text-grey">
              <p>No Academy Award nominations or wins for this movie.</p>
            </div>
          ) : (
            <div>
              {/* Awards */}
              <h3 className="subtitle is-5">Academy Awards</h3>
              {Object.entries(groupedByClass).length === 0 ? (
                <p className="has-text-grey">No details available.</p>
              ) : (
                Object.entries(groupedByClass).map(([classKey, noms]) => {
                  const categoryWins = noms.filter(n => n.winner).length
                  const categoryNoms = noms.length
                  return (
                  <div key={classKey} className="mb-4">
                    <h4 className="subtitle is-6 has-text-weight-bold">
                      {classKey}
                      <span className="has-text-weight-normal has-text-grey-light ml-2" style={{ fontSize: '0.9rem' }}>
                        ({categoryNoms} nomination{categoryNoms > 1 ? 's' : ''}, {categoryWins} win{categoryWins > 1 ? 's' : ''})
                      </span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {noms
                        .sort((a, b) => a.ceremony - b.ceremony)
                        .map((nom, idx) => (
                          <div
                            key={idx}
                            className="box"
                            style={{
                              padding: '0.75rem',
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
                              }}
                            >
                              <div>
                                <strong className="is-size-6">
                                  {nom.canonicalCategory}
                                  {nom.winner && ' 🏆'}
                                </strong>
                                {nom.name && (
                                  <p className="is-size-7 has-text-grey-light">{nom.name}</p>
                                )}
                                {nom.detail && (
                                  <p className="is-size-7 has-text-grey-light mt-1">{nom.detail}</p>
                                )}
                              </div>
                              <span className="tag is-dark is-small">
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
