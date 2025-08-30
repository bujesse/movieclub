'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useCurrentUser } from './CurrentUserProvider'
import { useVotes } from './VotesProvider'

export default function Header({ nextMeetupIso }: { nextMeetupIso?: string | null }) {
  const { usedVotes, maxVotes } = useVotes()
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
          <strong>🎬 Movie Club</strong>
        </a>

        {targetDate && (
          <div
            className="navbar-item"
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          >
            <TooltipDay targetDate={targetDate}>
              <Countdown targetDate={targetDate} />
            </TooltipDay>
          </div>
        )}

        <div className="navbar-item" style={{ gap: '0.5rem' }}>
          <p className="is-hidden-mobile">{display}</p>
          <span
            className={`tag is-medium ${
              usedVotes < maxVotes ? 'is-success' : 'is-danger is-light'
            }`}
          >
            Votes: {usedVotes}/{maxVotes}
          </span>
        </div>
      </div>
    </nav>
  )
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate)
  return (
    <span className="tag is-warning is-medium" suppressHydrationWarning>
      <span className="is-hidden-touch">Next meetup:&nbsp;</span>
      <span className="has-text-weight-semibold">
        {days}d {hours}h {minutes}m {seconds}s
      </span>
    </span>
  )
}

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(() => targetDate.getTime() - Date.now())

  useEffect(() => {
    const tick = () => setTimeLeft(targetDate.getTime() - Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetDate])

  if (timeLeft <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  const totalSeconds = Math.floor(timeLeft / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

/** tooltip that toggles on click, showing the exact day/time (client-only) */
function TooltipDay({ targetDate, children }: { targetDate: Date; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  const dayLabel = targetDate.toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  useEffect(() => {
    if (!show) return
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShow(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [show])

  return (
    <span
      ref={wrapperRef}
      className="tooltip-wrapper"
      onClick={() => setShow((s) => !s)}
      style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
    >
      {children}
      {show && <span className="tooltip-bubble">{dayLabel}</span>}

      <style jsx>{`
        .tooltip-bubble {
          position: absolute;
          top: 125%; /* show below */
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.85);
          color: #fff;
          padding: 0.35rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          white-space: nowrap;
          z-index: 10;
        }
        .tooltip-bubble::after {
          content: '';
          position: absolute;
          bottom: 100%; /* arrow points up */
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: transparent transparent rgba(0, 0, 0, 0.85) transparent;
        }
      `}</style>
    </span>
  )
}
