'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EnrichedCollection } from '../../types/collection'
import CollectionCard from '../CollectionCard'
import CreateCollectionModal from '../CreateCollectionModal'
import { useCurrentUser } from '../CurrentUserProvider'

export default function CollectionsClient({
  initialCollections,
}: {
  initialCollections: EnrichedCollection[]
}) {
  const router = useRouter()
  const { isAdminMode } = useCurrentUser()
  const [collections, setCollections] = useState<EnrichedCollection[]>(initialCollections)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const handleCreate = async (payload: {
    name: string
    description: string
    letterboxdUrl: string
    isGlobal: boolean
  }) => {
    setPending(true)
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        return
      }

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to create collection')
        return
      }

      const newCollection = await res.json()
      setCollections((prev) => [newCollection, ...prev])
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const handleDelete = (id: number) => {
    setCollections((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSync = () => {
    // Just refresh the page to get updated data
    router.refresh()
  }

  const handleEdit = (id: number, updatedCollection: EnrichedCollection) => {
    // Update the collection in local state
    setCollections((prev) => prev.map((c) => (c.id === id ? updatedCollection : c)))
  }

  return (
    <section className="section collections-section">
      <div className="container has-text-centered mb-5">
        <h2 className="title">Collections</h2>
        <p className="subtitle">Curated movie collections from Letterboxd</p>
        {isAdminMode && (
          <button
            className="button is-primary"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={pending}
          >
            Create New Collection
          </button>
        )}
      </div>

      <div className="container">

        {collections.length === 0 ? (
          <div className="notification is-info is-light">
            <p>No collections yet. {isAdminMode && 'Create one to get started!'}</p>
          </div>
        ) : (
          <div className="columns is-multiline">
            {collections.map((collection) => (
              <div key={collection.id} className="column is-12-mobile is-half-tablet">
                <CollectionCard
                  collection={collection}
                  onDelete={handleDelete}
                  onSync={handleSync}
                  onEdit={handleEdit}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <style jsx>{`
        @media screen and (max-width: 768px) {
          :global(.collections-section) {
            padding-top: 1.5rem;
          }
        }
      `}</style>
    </section>
  )
}
