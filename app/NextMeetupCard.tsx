'use client'

import { useState } from 'react'
import { useNextMeetup } from './NextMeetupContext'
import { format } from 'date-fns'
import { MovieList } from './ListCard'
import { MovieListAllWithFlags } from './page'

export default function NextMeetupCard() {
  const [open, setOpen] = useState(false)

  const nextMeetup = useNextMeetup()
  if (!nextMeetup || !nextMeetup.movieList) return null

  const list = nextMeetup.movieList
  const meetupDate = format(nextMeetup.date!, 'EEE, MMM d, h:mm a') // e.g., "Tue, Sep 2, 7:30 PM"

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
        {open && <MovieList list={list as MovieListAllWithFlags} />}
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
