'use client'

import { useState, useEffect } from 'react'
import ListModal from './ListModal'
import ListCard from './ListCard'
import { Prisma } from '@prisma/client'
import { useRouter } from 'next/navigation'

export type MovieListAll = Prisma.MovieListGetPayload<{
  include: {
    movies: true
    votes: true
  }
}>

// ----------------------
// Home Page
// ----------------------
export default function HomePage() {
  const [lists, setLists] = useState<MovieListAll[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialList, setInitialList] = useState<MovieListAll | undefined>(undefined)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const router = useRouter()

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/lists')
        if (!res.ok) throw new Error('Failed to fetch lists')
        const data = await res.json()
        setLists(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [])

  const handleCreateNewList = () => {
    setInitialList(undefined)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleSubmit = async (payload: any) => {
    try {
      const isEdit = modalMode === 'edit' && initialList
      const url = isEdit ? `/api/lists/${initialList!.id}` : '/api/lists'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.error(`${method} failed`, await res.text())
        return
      }

      const data = await res.json()

      setLists((prev) =>
        isEdit ? prev.map((l) => (l.id === data.id ? data : l)) : [data, ...prev]
      )

      setIsModalOpen(false)
      setInitialList(undefined)
      setModalMode('create')
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteList = (id: number) => {
    setLists((prev) => prev.filter((l) => l.id !== id))
  }

  const handleEditList = (id: number) => {
    const listToEdit = lists.find((l) => l.id === id)
    if (!listToEdit) return
    setInitialList(listToEdit)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  return (
    <section className="section">
      <div className="container has-text-centered mb-5">
        <h2 className="title">Movie Lists</h2>
        <button className="button is-primary is-medium mt-3" onClick={handleCreateNewList}>
          + Create New List
        </button>
      </div>

      {loading ? (
        <p>Loading lists...</p>
      ) : (
        <div className="fixed-grid has-1-cols-mobile	has-2-cols-tablet has-3-cols-widescreen">
          <div className="grid is-row-gap-5 is-column-gap-4 is-multiline">
            {lists.map((l) => (
              <div key={l.id} className="cell">
                <ListCard list={l} onDelete={handleDeleteList} onEdit={handleEditList} />
              </div>
            ))}
          </div>
        </div>
      )}

      <ListModal
        key={modalMode} // new key → new instance; fixes flash of old data when switching modes
        isOpen={isModalOpen}
        mode={modalMode}
        initialList={initialList}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
