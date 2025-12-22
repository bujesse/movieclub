'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from './CurrentUserProvider'
import { formatDistanceToNowStrict } from 'date-fns'
import { Trash2 } from 'lucide-react'

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="has-text-link">
          {part}
        </a>
      )
    }
    return part
  })
}

type Comment = {
  id: number
  movieListId: number
  userId: string
  text: string
  createdAt: string
}

export default function CommentModal({
  isOpen,
  listId,
  listTitle,
  onClose,
}: {
  isOpen: boolean
  listId: number
  listTitle: string
  onClose: () => void
}) {
  const { user } = useCurrentUser()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const fetchComments = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/lists/${listId}/comments`)
        if (!res.ok) throw new Error('Failed to fetch comments')
        const data = await res.json()
        setComments(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [isOpen, listId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/lists/${listId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      })

      if (!res.ok) throw new Error('Failed to add comment')

      const comment = await res.json()
      setComments([...comments, comment])
      setNewComment('')
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete comment')

      setComments(comments.filter((c) => c.id !== commentId))
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal is-active"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <div
        className="modal-background"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      <div
        className="modal-card"
        style={{ maxWidth: '600px' }}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <header className="modal-card-head">
          <p className="modal-card-title">Comments: {listTitle}</p>
          <button
            className="delete"
            aria-label="close"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          />
        </header>

        <section className="modal-card-body">
          {!loading && comments.length === 0 ? (
            <p className="has-text-centered has-text-grey">No comments yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.map((comment) => {
                const isOwner = comment.userId === user?.email
                const canDelete = isOwner || user?.isAdmin

                return (
                  <div
                    key={comment.id}
                    className="box"
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div>
                        <strong className="is-size-7">{comment.userId.split('@')[0]}</strong>
                        <span className="has-text-grey is-size-7 ml-2">
                          {formatDistanceToNowStrict(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {canDelete && (
                        <button
                          className="button is-small is-ghost has-text-danger"
                          onClick={() => handleDelete(comment.id)}
                          title="Delete comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{linkifyText(comment.text)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <footer className="modal-card-foot" style={{ flexDirection: 'column', gap: '0.5rem' }}>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="field">
              <div className="control">
                <textarea
                  className="textarea"
                  placeholder="Add a comment..."
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="field is-grouped is-grouped-right">
              <div className="control">
                <button
                  type="button"
                  className="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  disabled={submitting}
                >
                  Close
                </button>
              </div>
              <div className="control">
                <button
                  type="submit"
                  className="button is-primary"
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </div>
          </form>
        </footer>
      </div>
    </div>
  )
}
