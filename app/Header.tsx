'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCurrentUser } from './CurrentUserProvider'
import { useVotes } from './VotesProvider'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { useNextMeetup } from './NextMeetupContext'

export default function Header() {
  const { usedVotes, maxVotes } = useVotes()
  const { nextMeetup } = useNextMeetup()
  const nextMeetupIso = nextMeetup?.date?.toISOString() ?? null
  const me = useCurrentUser()
  const display = me?.name ?? (me?.email ? me.email.split('@')[0] : null)

  const targetDate = useMemo(() => {
    if (nextMeetupIso) {
      const d = new Date(nextMeetupIso)
      if (!Number.isNaN(d.getTime())) return d
    }
    return null
  }, [nextMeetupIso])

  return (
    <nav
      className="navbar is-fixed-top is-spaced is-dark"
      role="navigation"
      aria-label="main navigation"
    >
      <div
        className="navbar-brand custom-navbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          flex: '1 1 auto',
        }}
      >
        <a className="navbar-item" href="/">
          <strong>
            🎬 <span className="is-hidden-touch">Movie Club</span>
          </strong>
        </a>

        {targetDate && (
          <div
            className="navbar-item"
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          >
            <ToggleTime target={targetDate} />
          </div>
        )}

        <div className="navbar-item" style={{ gap: '0.5rem' }}>
          <p className="is-hidden-mobile">{display}</p>
          <span
            className={`tag is-size-7-mobile is-medium ${
              usedVotes < maxVotes ? 'is-white' : 'is-danger is-light'
            }`}
          >
            Votes:&nbsp;
            <span className="has-text-weight-semibold">
              {usedVotes}/{maxVotes}
            </span>
          </span>
        </div>
      </div>
    </nav>
  )
}

function ToggleTime({ target }: { target: Date }) {
  const [showAbsolute, setShowAbsolute] = useState(false)
  const [, setNow] = useState(Date.now())

  // Tick — use 1000 for second-level, 60000 for minute-level updates
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const rel = formatDistanceToNowStrict(target, { addSuffix: true }) // e.g., "in 2 hours"
  const abs = format(target, 'EEE, MMM d, h:mm a') // e.g., "Tue, Sep 2, 7:30 PM"

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setShowAbsolute((s) => !s)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowAbsolute((s) => !s)}
      className="is-size-7-mobile tag is-info is-medium"
      style={{ cursor: 'pointer', userSelect: 'none' }}
      aria-pressed={showAbsolute}
      suppressHydrationWarning
      title="Click to toggle time display"
    >
      <span>Next meetup:&nbsp;</span>
      <span className="has-text-weight-semibold">{showAbsolute ? abs : rel}</span>
    </span>
  )
}
