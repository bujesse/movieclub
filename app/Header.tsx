'use client'

import { useEffect, useRef, useState } from 'react'
import { useCurrentUser } from './CurrentUserProvider'
import { useVotes } from './VotesProvider'
import FilterSortControls from './FilterSortControls'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useListsPage } from './ListsPageContext'
import { ListFilter } from '../types/lists'
import {
  ROUTES,
  isActiveRoute,
  shouldShowFilterControls,
  buildRouteWithParams,
} from '../lib/routes'

export default function Header() {
  const { usedVotes, maxVotes } = useVotes()
  const navbarRef = useRef<HTMLElement>(null)
  const { user, isAdmin, isAdminMode, toggleAdminMode } = useCurrentUser()
  const display = user?.email ? user.email.split('@')[0] : null

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { filter, sortBy, setFilter, setSortBy, isReady } = useListsPage()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isFixingMovies, setIsFixingMovies] = useState(false)
  const toggleMenu = () => setIsMenuOpen((v) => !v)

  // Prevent hydration mismatch by only showing dynamic content after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Build URLs with current filter/sort params
  const homeUrl = buildRouteWithParams(ROUTES.HOME, searchParams)
  const listsUrl = buildRouteWithParams(ROUTES.LISTS, searchParams)
  const collectionsUrl = ROUTES.COLLECTIONS
  const archiveUrl = buildRouteWithParams(ROUTES.ARCHIVE, searchParams)
  const adminMeetupsUrl = ROUTES.ADMIN_MEETUPS

  const handleVotesBadgeClick = () => {
    if (!isActiveRoute(pathname, ROUTES.HOME)) {
      router.push(homeUrl)
    }
    setFilter(ListFilter.Voted)
  }

  const handleFixBrokenMovies = async () => {
    if (!confirm('This will hydrate all movies with missing TMDB details. Continue?')) {
      return
    }

    setIsFixingMovies(true)
    try {
      const res = await fetch('/api/admin/fix-broken-movies', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to fix movies')
        return
      }
      const data = await res.json()
      alert(
        `Started fixing ${data.movieCount} broken movies. This will take about ${Math.ceil(data.movieCount / 5)} seconds. Check the console for progress.`
      )
    } catch (err) {
      console.error('Fix broken movies error:', err)
      alert('Failed to start fix process')
    } finally {
      setIsFixingMovies(false)
    }
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
        <a className="navbar-item" href={homeUrl}>
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
            className={`navbar-burger has-text-grey-lighter ${isMenuOpen ? 'is-active' : ''}`}
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
          <a
            className={`navbar-item ${isActiveRoute(pathname, ROUTES.HOME) ? 'is-active' : ''}`}
            href={homeUrl}
          >
            Nominated
          </a>
          <a
            className={`navbar-item ${isActiveRoute(pathname, ROUTES.LISTS) ? 'is-active' : ''}`}
            href={listsUrl}
          >
            All Lists
          </a>
          <a
            className={`navbar-item ${isActiveRoute(pathname, ROUTES.COLLECTIONS) ? 'is-active' : ''}`}
            href={collectionsUrl}
          >
            Collections
          </a>
          <a
            className={`navbar-item ${isActiveRoute(pathname, ROUTES.ARCHIVE) ? 'is-active' : ''}`}
            href={archiveUrl}
          >
            Archive
          </a>
          {isAdminMode && (
            <a
              className={`navbar-item ${isActiveRoute(pathname, ROUTES.ADMIN_MEETUPS) ? 'is-active' : ''}`}
              href={adminMeetupsUrl}
            >
              Meetups
            </a>
          )}
          <a
            className={`navbar-item ${isActiveRoute(pathname, ROUTES.HOW_IT_WORKS) ? 'is-active' : ''}`}
            href={ROUTES.HOW_IT_WORKS}
          >
            How It Works
          </a>

          {/* Filter/Sort Controls - Desktop only, on lists pages */}
          {shouldShowFilterControls(pathname) && isMounted && isReady && (
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
            {/* fix broken movies button (admin only) */}
            {isAdminMode && (
              <button
                className="button is-small is-warning"
                onClick={handleFixBrokenMovies}
                disabled={isFixingMovies}
                title="Hydrate all movies with missing TMDB details"
              >
                {isFixingMovies ? 'Fixing...' : '🔧 Fix Broken Movies'}
              </button>
            )}

            {/* username as non-link tag */}
            {display && <span className="tag is-small">Logged in: {display}</span>}

            {/* admin toggle */}
            {isAdmin && (
              <button
                className={`tag is-small ${isAdminMode ? 'is-danger is-selected' : ''}`}
                onClick={toggleAdminMode}
                title="Toggle admin mode"
                suppressHydrationWarning
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
