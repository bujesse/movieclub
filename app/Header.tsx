'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useCurrentUser } from './CurrentUserProvider'
import { useVotes } from './VotesProvider'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { useNextMeetup } from './NextMeetupContext'

export default function Header() {
  const { usedVotes, maxVotes } = useVotes()
  const { nextMeetup } = useNextMeetup()
  const navbarRef = useRef<HTMLElement>(null)
  const nextMeetupIso = nextMeetup?.date?.toISOString() ?? null
  const { user, isAdmin, isAdminMode, toggleAdminMode } = useCurrentUser()
  const display = user?.email ? user.email.split('@')[0] : null

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = () => setIsMenuOpen((v) => !v)

  const targetDate = useMemo(() => {
    if (nextMeetupIso) {
      const d = new Date(nextMeetupIso)
      if (!Number.isNaN(d.getTime())) return d
    }
    return null
  }, [nextMeetupIso])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <nav
      ref={navbarRef}
      className="navbar is-fixed-top is-spaced is-dark"
      role="navigation"
      aria-label="main navigation"
    >
      {/* BRAND: logo + mobile votes + burger (same flex row) */}
      <div className="navbar-brand">
        <a className="navbar-item" href="/">
          <strong>
            🎬 <span>Movie Club</span>
          </strong>
        </a>

        {/* mobile votes + burger */}
        <div
          className="is-hidden-desktop"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingRight: '0.5rem',
          }}
        >
          <span
            className={`tag is-size-7-mobile is-medium ${
              usedVotes < maxVotes ? 'is-white' : 'is-success'
            }`}
          >
            Votes:&nbsp;
            <span className="has-text-weight-semibold">
              {usedVotes}/{maxVotes}
            </span>
          </span>

          <a
            role="button"
            className={`navbar-burger ${isMenuOpen ? 'is-active' : ''}`}
            aria-label="menu"
            aria-expanded={isMenuOpen}
            data-target="main-navbar-menu"
            onClick={toggleMenu}
            style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </a>
        </div>
      </div>

      <div id="main-navbar-menu" className={`navbar-menu ${isMenuOpen ? 'is-active' : ''}`}>
        <div className="navbar-start">
          <a className="navbar-item" href="/">
            Lists
          </a>
          <a className="navbar-item" href="/archive">
            Archive
          </a>
        </div>

        <div className="navbar-end">
          <div
            className="navbar-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            {/* username as non-link tag */}
            {display && <span className="tag is-small">Logged in: {display}</span>}

            {/* admin toggle */}
            {isAdmin && (
              <button
                className={`tag is-small ${isAdminMode ? 'is-danger is-selected' : ''}`}
                onClick={toggleAdminMode}
                title="Toggle admin mode"
              >
                Admin {isAdminMode ? 'ON' : 'OFF'}
              </button>
            )}

            {/* desktop votes */}
            <span
              className={`tag is-hidden-touch is-medium ${usedVotes < maxVotes ? 'is-white' : 'is-success'}`}
            >
              Votes:&nbsp;
              <span className="has-text-weight-semibold">
                {usedVotes}/{maxVotes}
              </span>
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

function ToggleTime({ target }: { target: Date }) {
  const [showAbsolute, setShowAbsolute] = useState(false)
  const [, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const rel = formatDistanceToNowStrict(target, { addSuffix: true })
  const abs = format(target, 'EEE, MMM d, h:mm a')

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
