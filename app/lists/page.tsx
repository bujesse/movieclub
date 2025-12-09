'use client'

import { useState, useEffect } from 'react'
import ListModal from '../ListModal'
import ListCard from '../ListCard'
import { useRouter } from 'next/navigation'
import NextMeetupCard from '../NextMeetupCard'
import { useCurrentUser } from '../CurrentUserProvider'
import FilterSortControls from '../FilterSortControls'
import { useListsPage } from '../ListsPageContext'
import { MovieListAllWithFlags } from '../page'
import { withDuplicateFlags } from '../../lib/listHelpers'
import { useToggleSeen, useFilterAndSort, useScrollToTopOnChange } from '../hooks/useMovieLists'
import { ROUTES } from '../../lib/routes'

export default function AllListsPage() {
  const [lists, setLists] = useState<MovieListAllWithFlags[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialList, setInitialList] = useState<any>(undefined)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [confirmChangeNominationId, setConfirmChangeNominationId] = useState<number | null>(null)

  const router = useRouter()
  const { user } = useCurrentUser()
  const { filter, sortBy, setFilter, setSortBy } = useListsPage()

  const onToggleSeen = useToggleSeen(setLists)
  useScrollToTopOnChange(filter, sortBy)

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/lists')
        if (!res.ok) throw new Error('Failed to fetch lists')
        const data = await res.json()
        setLists(withDuplicateFlags(data))
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

      setLists((prev) => {
        const next =
          modalMode === 'edit' && initialList
            ? prev.map((l) => (l.id === data.id ? data : l))
            : [data, ...prev]
        return withDuplicateFlags(next as MovieListAllWithFlags[])
      })

      setIsModalOpen(false)
      setInitialList(undefined)
      setModalMode('create')
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteList = (id: number) => {
    setLists((prev) =>
      withDuplicateFlags(prev.filter((l) => l.id !== id) as MovieListAllWithFlags[])
    )
  }

  const handleEditList = (id: number) => {
    const listToEdit = lists.find((l) => l.id === id)
    if (!listToEdit) return
    setInitialList(listToEdit)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleNominate = async (listId: number) => {
    const list = lists.find((l) => l.id === listId)
    if (!list) return

    const hasNominated = (list as any).nominations?.some((n: any) => n.userId === user?.email)
    const currentNominatedList = lists.find((l) =>
      (l as any).nominations?.some((n: any) => n.userId === user?.email)
    )
    const isChangingNomination =
      !hasNominated && currentNominatedList && currentNominatedList.id !== listId

    if (isChangingNomination && confirmChangeNominationId !== listId) {
      setConfirmChangeNominationId(listId)
      setTimeout(() => setConfirmChangeNominationId(null), 3000)
      return
    }

    setConfirmChangeNominationId(null)

    try {
      const method = hasNominated ? 'DELETE' : 'POST'
      const res = await fetch(`/api/lists/${listId}/nominate`, { method })

      if (!res.ok) {
        if (res.status === 400) {
          const data = await res.json()
          alert(data.error || 'Cannot remove nomination')
        }
        return
      }

      setLists((prev) =>
        prev.map((l) => {
          if (l.id === listId) {
            const updatedNominations = hasNominated
              ? (l as any).nominations.filter((n: any) => n.userId !== user?.email)
              : [...((l as any).nominations || []), { userId: user!.email }]
            return { ...l, nominations: updatedNominations }
          }
          if (hasNominated) return l
          return {
            ...l,
            nominations: ((l as any).nominations || []).filter(
              (n: any) => n.userId !== user?.email
            ),
          }
        })
      )

      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const filteredAndSortedLists = useFilterAndSort(lists, filter, sortBy, user?.email)

  return (
    <section className="section">
      <NextMeetupCard onToggleSeenAction={onToggleSeen} />

      <div className="container has-text-centered mb-5">
        <h2 className="title">All Movie Lists</h2>
        <p className="subtitle">
          Nominate your favorite list for the next meetup. Vote on{' '}
          <a href={ROUTES.HOME}>Nominated Lists</a>.
        </p>
        <button className="button is-primary is-medium mt-3" onClick={handleCreateNewList}>
          + Create New List
        </button>
      </div>

      <div className="navbar is-dark is-fixed-bottom is-hidden-desktop">
        <div
          className="is-flex is-justify-content-center"
          style={{
            padding: '0.75rem',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
          }}
        >
          <FilterSortControls
            filter={filter}
            sortBy={sortBy}
            onFilterChangeAction={setFilter}
            onSortChangeAction={setSortBy}
            variant="compact"
          />
        </div>
      </div>

      {loading ? (
        <p>Loading lists...</p>
      ) : (
        <div
          className="fixed-grid has-1-cols-mobile	has-2-cols-tablet has-3-cols-widescreen"
          style={{ paddingBottom: '5rem' }}
        >
          <div className="grid is-row-gap-5 is-column-gap-4 is-multiline">
            {filteredAndSortedLists.map((l) => {
              const hasNominated = (l as any).nominations?.some(
                (n: any) => n.userId === user?.email
              )
              const isAlreadyNominated = ((l as any).nominations?.length ?? 0) > 0
              const isConfirmingChange = confirmChangeNominationId === l.id
              // Check if there are votes from users other than the current user
              const hasVotesFromOthers = (l as any).votes?.some(
                (v: any) => v.userId !== user?.email
              )
              const isLocked = hasNominated && hasVotesFromOthers
              return (
                <div key={l.id} className="cell">
                  <ListCard
                    list={l}
                    actions={{
                      onEdit: handleEditList,
                      onDelete: handleDeleteList,
                      onToggleSeen,
                    }}
                    display={{
                      initialCommentCount: l.commentCount,
                      showNominatedBy: true,
                      isLocked,
                    }}
                    nomination={{
                      hasNominated,
                      isAlreadyNominated,
                      onNominate: handleNominate,
                      isConfirming: isConfirmingChange,
                      isLocked,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ListModal
        key={modalMode}
        isOpen={isModalOpen}
        mode={modalMode}
        initialList={initialList}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
