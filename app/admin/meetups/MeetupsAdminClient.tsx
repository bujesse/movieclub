'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCurrentUser } from '../../CurrentUserProvider'

type MeetupRow = {
  id: number
  date: string | null
  movieListId: number | null
  movieList?: {
    id: number
    title: string
  } | null
}

type ListOption = {
  id: number
  title: string
  meetupId: number | null
}

type MeetupsResponse = {
  meetups: MeetupRow[]
  lists: ListOption[]
}

function toLocalInputValue(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export default function MeetupsAdminClient() {
  const { isAdminMode } = useCurrentUser()
  const [meetups, setMeetups] = useState<MeetupRow[]>([])
  const [lists, setLists] = useState<ListOption[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newDate, setNewDate] = useState('')
  const [newMovieListId, setNewMovieListId] = useState<number | null>(null)
  const [autoPending, setAutoPending] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/meetups')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load meetups')
      }
      const data = (await res.json()) as MeetupsResponse
      setMeetups(
        data.meetups
          .map((m) => ({
            ...m,
            date: toLocalInputValue(m.date),
          }))
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0
            const dateB = b.date ? new Date(b.date).getTime() : 0
            return dateB - dateA
          })
      )
      setLists(data.lists)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load meetups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const availableLists = useMemo(
    () => lists.filter((l) => l.meetupId == null),
    [lists]
  )

  const getMeetupOptions = (meetup: MeetupRow) => {
    if (!meetup.movieListId) return availableLists
    const current = lists.find((l) => l.id === meetup.movieListId)
    if (!current) return availableLists
    return [current, ...availableLists.filter((l) => l.id !== current.id)]
  }

  const handleMeetupChange = (id: number, patch: Partial<MeetupRow>) => {
    setMeetups((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  const handleCreate = async () => {
    if (!newDate) {
      setError('Date is required to create a meetup.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/meetups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          movieListId: newMovieListId,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create meetup')
      }
      setNewDate('')
      setNewMovieListId(null)
      await loadData()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create meetup')
    } finally {
      setPending(false)
    }
  }

  const handleAutoAdd = async () => {
    if (meetups.length === 0) {
      setError('No existing meetups to base auto-add on.')
      return
    }
    setAutoPending(true)
    setError(null)
    try {
      const latest = meetups.find((m) => m.date)
      if (!latest?.date) {
        throw new Error('Latest meetup has no date.')
      }
      const latestDate = new Date(latest.date)
      if (Number.isNaN(latestDate.getTime())) {
        throw new Error('Latest meetup date is invalid.')
      }
      const nextDate = new Date(latestDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      const offsetMs = nextDate.getTimezoneOffset() * 60 * 1000
      const localValue = new Date(nextDate.getTime() - offsetMs).toISOString().slice(0, 16)

      const res = await fetch('/api/admin/meetups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: localValue,
          movieListId: null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to auto-add meetup')
      }
      await loadData()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to auto-add meetup')
    } finally {
      setAutoPending(false)
    }
  }

  const handleSave = async (meetup: MeetupRow) => {
    if (!meetup.date) {
      setError('Meetup date cannot be empty.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/meetups/${meetup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: meetup.date,
          movieListId: meetup.movieListId,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update meetup')
      }
      await loadData()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update meetup')
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this meetup? Votes and nominations for it will be removed.')) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/meetups/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete meetup')
      }
      await loadData()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete meetup')
    } finally {
      setPending(false)
    }
  }

  if (!isAdminMode) {
    return (
      <section className="section">
        <div className="container">
          <div className="notification is-warning">Admin mode is off.</div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <div className="mb-5">
          <h2 className="title">Meetups</h2>
          <p className="subtitle">Add, edit, or remove meetup entries.</p>
        </div>

        {error && (
          <div className="notification is-danger">
            <button className="delete" onClick={() => setError(null)} />
            {error}
          </div>
        )}

        <div className="box mb-5">
          <h3 className="title is-6">Add Meetup</h3>
          <div className="field is-grouped is-grouped-multiline">
            <div className="control">
              <input
                className="input"
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="control">
              <div className="select">
                <select
                  value={newMovieListId?.toString() ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setNewMovieListId(value ? Number(value) : null)
                  }}
                >
                  <option value="">No list selected</option>
                  {availableLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="control">
              <button className="button is-primary" onClick={handleCreate} disabled={pending}>
                Add
              </button>
            </div>
            <div className="control">
              <button
                className="button is-light"
                onClick={handleAutoAdd}
                disabled={autoPending || pending}
              >
                {autoPending ? 'Adding…' : 'Auto add'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="notification">Loading…</div>
        ) : meetups.length === 0 ? (
          <div className="notification is-info">No meetups yet.</div>
        ) : (
          <div className="table-container">
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Selected List</th>
                  <th className="has-text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetups.map((meetup) => {
                  const options = getMeetupOptions(meetup)
                  return (
                    <tr key={meetup.id}>
                      <td>
                        <input
                          className="input"
                          type="datetime-local"
                          value={meetup.date ?? ''}
                          onChange={(e) => handleMeetupChange(meetup.id, { date: e.target.value })}
                        />
                      </td>
                      <td>
                        <div className="select is-fullwidth">
                          <select
                            value={meetup.movieListId?.toString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value
                              handleMeetupChange(meetup.id, {
                                movieListId: value ? Number(value) : null,
                              })
                            }}
                          >
                            <option value="">No list selected</option>
                            {options.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="has-text-right">
                        <div className="buttons" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="button is-light"
                            onClick={() => handleSave(meetup)}
                            disabled={pending}
                          >
                            Save
                          </button>
                          <button
                            className="button is-danger is-light"
                            onClick={() => handleDelete(meetup.id)}
                            disabled={pending}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
