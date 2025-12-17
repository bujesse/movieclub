'use client'

import { useState } from 'react'
import { EnrichedCollection } from '../types/collection'
import { tmdbImage } from '../lib/tmdb'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from './CurrentUserProvider'
import { RefreshCw } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import RadialStats from './RadialStats'
import EditCollectionModal from './EditCollectionModal'
import CollectionMoviesModal from './CollectionMoviesModal'

type CollectionCardProps = {
  collection: EnrichedCollection
  onDelete: (id: number) => void
  onSync: (id: number) => void
  onEdit: (id: number, updatedCollection: EnrichedCollection) => void
  showOscarBadges?: boolean
}

export default function CollectionCard({
  collection,
  onDelete,
  onSync,
  onEdit,
  showOscarBadges = true,
}: CollectionCardProps) {
  const { user, isAdminMode } = useCurrentUser()
  const myEmail = user!.email
  const router = useRouter()

  const [pending, setPending] = useState(false)
  const [areYouSure, setAreYouSure] = useState(false)
  const [syncPending, setSyncPending] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMoviesModalOpen, setIsMoviesModalOpen] = useState(false)

  // Track seen state locally for optimistic updates
  const [movieSeenState, setMovieSeenState] = useState<
    Record<number, { hasSeen: boolean; seenCount: number }>
  >({})

  const wasCreatedByMe = collection.createdBy === myEmail

  // Helper to get seen state (with optimistic updates)
  const getSeenState = (tmdbId: number) => {
    const movie = collection.movies.find((m) => m.movie.tmdbId === tmdbId)?.movie as EnrichedCollection['movies'][number]['movie'] | undefined
    if (!movie) return { hasSeen: false, seenCount: 0 }

    return movieSeenState[tmdbId] || {
      hasSeen: movie.hasSeen,
      seenCount: movie.seenCount,
    }
  }

  // Calculate updated stats based on optimistic state
  const updatedStats = {
    userSeenCount: collection.stats.userSeenCount,
    clubSeenCount: collection.stats.clubSeenCount,
    anyoneSeenCount: collection.stats.anyoneSeenCount,
  }

  // Adjust stats based on movieSeenState changes
  collection.movies.forEach((m: EnrichedCollection['movies'][number]) => {
    const optimisticState = movieSeenState[m.movie.tmdbId]
    if (optimisticState) {
      const originalHasSeen = m.movie.hasSeen
      const newHasSeen = optimisticState.hasSeen

      // If user toggled their seen status
      if (originalHasSeen !== newHasSeen) {
        if (newHasSeen) {
          updatedStats.userSeenCount++
          // If this was the first person to see it, increment anyoneSeen
          if (m.movie.seenCount === 0) {
            updatedStats.anyoneSeenCount++
          }
        } else {
          updatedStats.userSeenCount--
          // If removing the last seen, decrement anyoneSeen
          if (m.movie.seenCount === 1 && m.movie.seenBy?.length === 1) {
            updatedStats.anyoneSeenCount--
          }
        }
      }
    }
  })

  const handleDelete = async () => {
    if (!areYouSure) {
      setAreYouSure(true)
      setTimeout(() => setAreYouSure(false), 3000)
      return
    }
    setPending(true)
    try {
      const res = await fetch(`/api/collections/${collection.id}`, { method: 'DELETE' })
      if (res.status === 401) {
        return
      }
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Cannot delete collection')
        return
      }
      onDelete(collection.id)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const handleSync = async () => {
    setSyncPending(true)
    try {
      const res = await fetch(`/api/collections/${collection.id}/sync`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to sync collection')
        return
      }
      onSync(collection.id)
      router.refresh()
    } finally {
      setSyncPending(false)
    }
  }

  const handleSeenClick = async (e: React.MouseEvent, movie: EnrichedCollection['movies'][number]['movie']) => {
    e.preventDefault()
    e.stopPropagation()

    const currentState = movieSeenState[movie.tmdbId] || {
      hasSeen: movie.hasSeen,
      seenCount: movie.seenCount,
    }

    // Optimistic update
    const newHasSeen = !currentState.hasSeen
    const newSeenCount = newHasSeen ? currentState.seenCount + 1 : currentState.seenCount - 1

    setMovieSeenState((prev) => ({
      ...prev,
      [movie.tmdbId]: {
        hasSeen: newHasSeen,
        seenCount: newSeenCount,
      },
    }))

    // Make API call
    await fetch(`/api/movies/${movie.tmdbId}/seen`, {
      method: currentState.hasSeen ? 'DELETE' : 'POST',
    })
    router.refresh()
  }

  const handleEdit = async (payload: { name: string; description: string }) => {
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to update collection')
        return
      }
      const updatedCollection = await res.json()
      onEdit(collection.id, updatedCollection)
      setIsEditModalOpen(false)
    } catch (err) {
      console.error('Edit failed:', err)
      alert('Failed to update collection')
    }
  }

  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => setIsMoviesModalOpen(true)}>
      {/* Header */}
      <header className="card-header" style={{ padding: '0.5rem 0.75rem' }}>
        <div className="card-header-title is-block" style={{ padding: 0 }}>
          <div>
            <p className="mb-2">{collection.name}</p>
            {collection.description && (
              <p className="is-size-7 has-text-grey-light">{collection.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Stats with radial graphic */}
      <div className="card-content" style={{ paddingTop: '1.25rem', paddingBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Radial stats graphic */}
          <div>
            <RadialStats
              total={collection.movieCount}
              userSeen={updatedStats.userSeenCount}
              clubSeen={updatedStats.clubSeenCount}
              anyoneSeen={updatedStats.anyoneSeenCount}
            />
          </div>

          {/* Legend */}
          <div style={{ minWidth: '200px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#3e8ed0',
                  }}
                />
                <span className="is-size-7">
                  Group has seen it: <strong>{updatedStats.clubSeenCount}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#48c78e',
                  }}
                />
                <span className="is-size-7">
                  I've seen it: <strong>{updatedStats.userSeenCount}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#dbdbdb',
                  }}
                />
                <span className="is-size-7">
                  Anyone has seen it: <strong>{updatedStats.anyoneSeenCount}</strong>
                </span>
              </div>
              {collection.lastSyncedAt && (
                <div
                  className="is-size-7 has-text-grey"
                  style={{ marginTop: '0.5rem' }}
                  suppressHydrationWarning
                >
                  Synced{' '}
                  {formatDistanceToNowStrict(new Date(collection.lastSyncedAt), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Footer actions */}
      <footer className="card-footer">
        {(wasCreatedByMe || isAdminMode) && (
          <button
            className="card-footer-item button is-light"
            onClick={(e) => {
              e.stopPropagation()
              handleSync()
            }}
            disabled={syncPending}
            title="Refresh from Letterboxd"
          >
            <span className="icon is-small">
              <RefreshCw size={16} className={syncPending ? 'rotating' : ''} />
            </span>
            <span className="ml-2">{syncPending ? 'Syncing...' : 'Refresh'}</span>
          </button>
        )}
        {(wasCreatedByMe || isAdminMode) && (
          <button
            className="card-footer-item button has-text-link"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditModalOpen(true)
            }}
          >
            Edit
          </button>
        )}
        {(wasCreatedByMe || isAdminMode) && (
          <button
            className="card-footer-item button has-text-danger"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            disabled={pending}
          >
            {areYouSure ? 'Are you sure?' : 'Delete'}
          </button>
        )}
      </footer>

      <CollectionMoviesModal
        isOpen={isMoviesModalOpen}
        onClose={() => setIsMoviesModalOpen(false)}
        collectionName={collection.name}
        movies={collection.movies}
        onSeenClick={handleSeenClick}
        getSeenState={getSeenState}
        showOscarBadges={showOscarBadges}
      />

      <EditCollectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEdit}
        initialName={collection.name}
        initialDescription={collection.description || ''}
      />

      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        :global(.rotating) {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
