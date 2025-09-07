'use client'

import { useState } from 'react'
import { useNextMeetup } from './NextMeetupContext'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { MovieList } from './ListCard'
import { MovieListAllWithFlags } from './page'

export default function NextMeetupCard({
  onToggleSeen,
}: {
  onToggleSeen: (tmdbId: number, hasSeen: boolean) => void
}) {
  const [open, setOpen] = useState(false)

  const { nextMeetup, pollsCloseAt } = useNextMeetup()
  if (!nextMeetup) return null

  const meetupDate = format(nextMeetup.date!, 'EEE, MMM d, h:mm a') // e.g., "Tue, Sep 2, 7:30 PM"

  if (!nextMeetup.movieList && pollsCloseAt) {
    return (
      <div
        className="box mb-5 has-background-black-ter"
        style={{ border: '1px solid #ffdd57', borderRadius: '4px' }}
      >
        <p className="has-text-grey-light is-uppercase is-size-7 mb-1">
          Next Meetup - {meetupDate}
        </p>
        <strong className="is-size-5 has-text-warning">
          Polls close {format(pollsCloseAt, 'EEE, MMM d, h:mm a')} (
          {formatDistanceToNowStrict(pollsCloseAt, { addSuffix: true })})
        </strong>
      </div>
    )
  }

  const list = nextMeetup.movieList!

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
          <strong className="is-size-5">{list.title}</strong>
        </div>
        <div className="right">
          {/* <span className={`chevron ${open ? 'rotated' : ''}`}>▼</span> */}
        </div>
      </div>

      <div className="mt-3">
        <div className="has-text-weight-medium mb-3">
          <span className={`chevron ${open ? 'rotated' : ''}`}>▼</span>
          &nbsp;&nbsp;Movies
        </div>
        {open && <MovieList list={list as MovieListAllWithFlags} onToggleSeen={onToggleSeen} />}
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
    </div>
  )
}
