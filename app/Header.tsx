'use client'

import { useEffect, useRef, useState } from 'react'
import { useCurrentUser } from './CurrentUserProvider'
import { useVotes } from './VotesProvider'
import FilterSortControls from './FilterSortControls'
import { usePathname, useRouter } from 'next/navigation'
import { useListsPage } from './ListsPageContext'
import { ListFilter } from '../types/lists'

export default function Header() {
  const { usedVotes, maxVotes } = useVotes()
  const navbarRef = useRef<HTMLElement>(null)
  const { user, isAdmin, isAdminMode, toggleAdminMode } = useCurrentUser()
  const display = user?.email ? user.email.split('@')[0] : null

  const pathname = usePathname()
  const router = useRouter()
  const { filter, sortBy, setFilter, setSortBy } = useListsPage()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = () => setIsMenuOpen((v) => !v)

  // Only show controls on home page
  const isHomePage = pathname === '/'

  const handleVotesBadgeClick = () => {
    if (!isHomePage) {
      router.push('/')
    }
    setFilter(ListFilter.Voted)
  }

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
            onClick={handleVotesBadgeClick}
            style={{ cursor: 'pointer' }}
            title="Click to see your voted lists"
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

          {/* Filter/Sort Controls - Desktop only, on lists page */}
          {isHomePage && (
            <div className="navbar-item is-hidden-touch">
              <FilterSortControls
                filter={filter}
                sortBy={sortBy}
                onFilterChangeAction={setFilter}
                onSortChangeAction={setSortBy}
              />
            </div>
          )}
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
              onClick={handleVotesBadgeClick}
              style={{ cursor: 'pointer' }}
              title="Click to see your voted lists"
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
