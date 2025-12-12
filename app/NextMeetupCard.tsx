'use client'

import { useState } from 'react'
import { useNextMeetup } from './NextMeetupContext'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { MovieList } from './ListCard'
import { MovieListAllWithFlags } from './page'
import { useCurrentUser } from './CurrentUserProvider'
import { MessageCircle } from 'lucide-react'
import CommentModal from './CommentModal'

export default function NextMeetupCard({
  onToggleSeenAction,
}: {
  onToggleSeenAction: (tmdbId: number, hasSeen: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const { isAdmin } = useCurrentUser()

  const { nextMeetup, pollsCloseAt } = useNextMeetup()
  if (!nextMeetup) return null

  const meetupDate = format(nextMeetup.date!, 'EEE, MMM d, h:mm a') // e.g., "Tue, Sep 2, 7:30 PM"

  if (!nextMeetup.movieList && pollsCloseAt) {
    const runPickMovie = async (e: React.MouseEvent) => {
      e.stopPropagation()
      const res = await fetch('/api/admin/pick-movie', { method: 'POST' })
      const data = await res.json()
      console.log('pickMovieJob', data)
    }

    return (
      <div
        className="box mb-5 has-background-black-ter"
        style={{ border: '1px solid #ffdd57', borderRadius: '4px' }}
      >
        <div className="is-flex is-justify-content-space-between">
          <div className="left">
            <p className="has-text-grey-light is-uppercase is-size-7 mb-1">
              Next Meetup - {meetupDate}
            </p>
            <strong className="is-size-5 has-text-warning">
              Polls close {format(pollsCloseAt, 'EEE, MMM d, h:mm a')} (
              {formatDistanceToNowStrict(pollsCloseAt, { addSuffix: true })})
            </strong>
            <p className="is-size-6 has-text-grey-light mt-1">
              Chosen list will be the first in the lists below. Ordering is done by most votes, then
              all-time votes, then by oldest first.
            </p>
          </div>
          <div className="right">
            {isAdmin && (
              <button
                className={`button is-warning is-light is-small`}
                onClick={runPickMovie}
                title="Finalize polls now"
              >
                Finalize polls
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
  const list = nextMeetup.movieList!
  const totalRuntime = list.movies.reduce((sum, m) => sum + (m.runtime ?? 0), 0)
  const score = (list.votes ?? []).reduce((a, v) => a + v.value, 0)
  const allTimeScore = (list as any).votesTotal ?? 0
  const initialCommentCount = (list as any).commentCount ?? 0

  // Initialize comment count if not set
  if (commentCount === 0 && initialCommentCount > 0) {
    setCommentCount(initialCommentCount)
  }

  return (
    <div
      className="box mb-5 has-background-black-ter"
      style={{ cursor: 'pointer' }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="is-flex is-justify-content-space-between">
        <div className="left">
          <p className="has-text-grey-light is-uppercase is-size-7 mb-1">
            Next Meetup - {meetupDate}
          </p>
          <div className="is-flex is-align-items-center">
            <strong className="is-size-5">{list.title}</strong>
            {open && (
              <span className="tag is-success ml-3" title="Votes received (all-time total)">
                {score} ({allTimeScore}) {score === 1 ? 'vote' : 'votes'}
              </span>
            )}
          </div>
        </div>
        <div className="right">
          <button
            className="button is-small is-light"
            onClick={(e) => {
              e.stopPropagation()
              setIsCommentModalOpen(true)
            }}
            title="Comments"
          >
            <span className="icon is-small">
              <MessageCircle size={16} />
            </span>
            <span className="ml-2">{commentCount}</span>
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="has-text-weight-medium mb-3">
          <span className={`chevron ${open ? 'rotated' : ''}`}>▼</span>
          &nbsp;&nbsp;Movies
          {open && totalRuntime > 0 && (
            <>
              {' '}
              &middot; {Math.floor(totalRuntime / 60)}h {totalRuntime % 60}m
            </>
          )}
        </div>
        {open && (
          <MovieList
            list={list as MovieListAllWithFlags}
            onToggleSeenAction={onToggleSeenAction}
            showWatchedBadge={false}
          />
        )}
      </div>
      <style jsx>{`
        .chevron {
          display: inline-block;
          transition: transform 0.2s ease;
          transform: rotate(-90deg); /* default closed → right */
        }
        .chevron.rotated {
          transform: rotate(0deg); /* open → down */
        }
      `}</style>

      <CommentModal
        isOpen={isCommentModalOpen}
        listId={list.id}
        listTitle={list.title}
        onClose={() => {
          setIsCommentModalOpen(false)
          // Refresh comment count when modal closes
          fetch(`/api/lists/${list.id}/comments`)
            .then((res) => res.json())
            .then((comments) => setCommentCount(comments.length))
            .catch(console.error)
        }}
      />
    </div>
  )
}
