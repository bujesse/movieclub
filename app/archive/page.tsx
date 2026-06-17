'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import ListCard from '../ListCard'
import { MovieListAllWithFlags } from '../page'
import { withDuplicateFlags } from '../../lib/listHelpers'
import { useToggleSeen, useFilterAndSort, useScrollToTopOnChange, useURLSync } from '../hooks/useMovieLists'
import { useListsPage } from '../ListsPageContext'
import { useCurrentUser } from '../CurrentUserProvider'
import FilterSortControls from '../FilterSortControls'
import { formatMinutes } from '../../lib/helpers'
import { formatLanguageLabel } from '../../lib/language'

type CreditPerson = {
  id?: number
  name?: string
}

function getTickValues(maxValue: number) {
  if (maxValue <= 0) return [0]
  if (maxValue <= 4) return Array.from({ length: maxValue + 1 }, (_, index) => index)

  const roughStep = maxValue / 4
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const niceStep =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = niceStep * magnitude
  const ticks = []

  for (let value = 0; value <= maxValue; value += step) {
    ticks.push(value)
  }

  if (ticks[ticks.length - 1] !== maxValue) {
    ticks.push(Math.ceil(maxValue / step) * step)
  }

  return ticks
}

function ArchivePageContent() {
  const [lists, setLists] = useState<MovieListAllWithFlags[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredYear, setHoveredYear] = useState<number | null>(null)
  const [hoveredCredit, setHoveredCredit] = useState<string | null>(null)

  const { user } = useCurrentUser()
  const { filter, sortBy, setFilter, setSortBy } = useListsPage()

  // Enable URL persistence for filters and sorting
  const { isReady } = useURLSync()

  const onToggleSeen = useToggleSeen(setLists)
  useScrollToTopOnChange(filter, sortBy)

  const setHoveredYearFromTouch = (clientX: number, clientY: number) => {
    const touched = document.elementFromPoint(clientX, clientY)
    const slot = touched?.closest('[data-year-slot]')
    const year = slot?.getAttribute('data-year-slot')
    setHoveredYear(year ? Number(year) : null)
  }

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/lists/archive')
        if (!res.ok) throw new Error('Failed to fetch archive lists')
        const data = await res.json()
        setLists(withDuplicateFlags(data))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [])

  const filteredAndSortedLists = useFilterAndSort(lists, filter, sortBy, user?.email)

  const archiveStats = useMemo(() => {
    const winnerCounts = new Map<string, number>()
    const actorMovieCounts = new Map<string, number>()
    const directorMovieCounts = new Map<string, number>()
    const actorMovies = new Map<string, string[]>()
    const directorMovies = new Map<string, string[]>()
    const languageCounts = new Map<string, number>()
    const languageMovies = new Map<string, string[]>()
    const yearCounts = new Map<number, number>()
    const yearMovies = new Map<number, string[]>()
    const seenMovies = new Set<number>()
    let englishMovieCount = 0
    let nonEnglishMovieCount = 0
    let totalMovieCount = 0
    let totalRuntimeMinutes = 0
    let earliestMeetupTime: number | null = null
    let latestMeetupTime: number | null = null

    for (const list of filteredAndSortedLists) {
      winnerCounts.set(list.createdBy, (winnerCounts.get(list.createdBy) ?? 0) + 1)
      totalMovieCount += list.movies.length
      const meetupDate = (list as any).Meetup?.date ? new Date((list as any).Meetup.date) : null
      const meetupTime =
        meetupDate && !Number.isNaN(meetupDate.getTime()) ? meetupDate.getTime() : null

      if (meetupTime !== null) {
        earliestMeetupTime =
          earliestMeetupTime === null ? meetupTime : Math.min(earliestMeetupTime, meetupTime)
        latestMeetupTime =
          latestMeetupTime === null ? meetupTime : Math.max(latestMeetupTime, meetupTime)
      }

      for (const movie of list.movies) {
        totalRuntimeMinutes += movie.runtime && movie.runtime > 0 ? movie.runtime : 0
        const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
        if (releaseYear && Number.isFinite(releaseYear)) {
          yearCounts.set(releaseYear, (yearCounts.get(releaseYear) ?? 0) + 1)
          yearMovies.set(releaseYear, [...(yearMovies.get(releaseYear) ?? []), movie.title])
        }
        const language = movie.originalLanguage?.trim() || movie.original_language?.trim()
        if (language) {
          languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1)
          languageMovies.set(language, [...(languageMovies.get(language) ?? []), movie.title])
          if (language.toLowerCase().startsWith('en')) {
            englishMovieCount += 1
          } else {
            nonEnglishMovieCount += 1
          }
        }
        if (seenMovies.has(movie.tmdbId)) continue
        seenMovies.add(movie.tmdbId)

        const actors = Array.isArray(movie.actors) ? (movie.actors as CreditPerson[]) : []
        const directors = Array.isArray(movie.directors) ? (movie.directors as CreditPerson[]) : []

        for (const actor of actors) {
          const name = actor?.name?.trim()
          if (!name) continue
          actorMovieCounts.set(name, (actorMovieCounts.get(name) ?? 0) + 1)
          actorMovies.set(name, [...(actorMovies.get(name) ?? []), movie.title])
        }

        for (const director of directors) {
          const name = director?.name?.trim()
          if (!name) continue
          directorMovieCounts.set(name, (directorMovieCounts.get(name) ?? 0) + 1)
          directorMovies.set(name, [...(directorMovies.get(name) ?? []), movie.title])
        }
      }
    }

    const sortedWinners = Array.from(winnerCounts.entries())
      .map(([email, count]) => ({ name: email.split('@')[0], count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const sortedActors = Array.from(actorMovieCounts.entries())
      .map(([name, count]) => ({ name, count, movies: actorMovies.get(name) ?? [] }))
      .filter((entry) => entry.count > 1)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const sortedDirectors = Array.from(directorMovieCounts.entries())
      .map(([name, count]) => ({ name, count, movies: directorMovies.get(name) ?? [] }))
      .filter((entry) => entry.count > 1)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const sortedLanguages = Array.from(languageCounts.entries())
      .map(([name, count]) => ({
        key: name,
        name: formatLanguageLabel(name) ?? name.toUpperCase(),
        count,
        movies: languageMovies.get(name) ?? [],
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const sortedYears = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)
    const yearSeries =
      sortedYears.length === 0
        ? []
        : Array.from(
            { length: sortedYears[sortedYears.length - 1].year - sortedYears[0].year + 1 },
            (_, index) => {
              const year = sortedYears[0].year + index
              return {
                year,
                count: yearCounts.get(year) ?? 0,
                movies: yearMovies.get(year) ?? [],
              }
            }
          )
    const maxYearCount = yearSeries.reduce((max, entry) => Math.max(max, entry.count), 0)
    const yearTicks = getTickValues(maxYearCount)
    const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000
    const weeksCovered =
      earliestMeetupTime !== null && latestMeetupTime !== null
        ? Math.max(1, (latestMeetupTime - earliestMeetupTime) / millisecondsPerWeek + 1)
        : 1

    return {
      listCount: filteredAndSortedLists.length,
      totalMovieCount,
      totalRuntimeMinutes,
      englishMovieCount,
      nonEnglishMovieCount,
      averageRuntimePerWeek: totalRuntimeMinutes / weeksCovered,
      averageRuntimePerList:
        filteredAndSortedLists.length > 0 ? totalRuntimeMinutes / filteredAndSortedLists.length : 0,
      yearCounts: yearSeries,
      maxYearCount,
      yearTicks,
      topWinners: sortedWinners,
      topActors: sortedActors,
      topDirectors: sortedDirectors,
      topLanguages: sortedLanguages,
    }
  }, [filteredAndSortedLists])

  const renderHoverableEntries = (
    entries: Array<{ key?: string; name: string; count: number; movies: string[] }>,
    emptyLabel: string,
    keyPrefix: string,
    limit = 5
  ) => {
    if (entries.length === 0) return emptyLabel

    return entries.slice(0, limit).map((entry, index) => {
      const hoverKey = `${keyPrefix}:${entry.key ?? entry.name}`
      const isLeftEdge = index === 0
      const isRightEdge = index === Math.min(entries.length, limit) - 1

      return (
        <span key={hoverKey}>
          <span
            style={{
              position: 'relative',
              display: 'inline-block',
              textDecorationLine: 'underline',
              textDecorationStyle: 'dotted',
              textDecorationColor: 'rgba(255,255,255,0.25)',
              textUnderlineOffset: '0.18em',
              cursor: 'default',
            }}
            onMouseEnter={() => setHoveredCredit(hoverKey)}
            onMouseLeave={() => setHoveredCredit((current) => (current === hoverKey ? null : current))}
          >
            {entry.name} ({entry.count})
            {hoveredCredit === hoverKey && (
              <span
                style={{
                  position: 'absolute',
                  left: isLeftEdge ? '0' : isRightEdge ? 'auto' : '50%',
                  right: isRightEdge ? '0' : 'auto',
                  bottom: 'calc(100% + 8px)',
                  transform: isLeftEdge || isRightEdge ? 'translateX(0)' : 'translateX(-50%)',
                  width: '220px',
                  padding: '0.45rem 0.55rem',
                  background: '#20242d',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                  textAlign: 'left',
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              >
                <span
                  className="has-text-white"
                  style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, marginBottom: '0.25rem' }}
                >
                  {entry.name} · {entry.count}
                </span>
                <span
                  className="has-text-grey-light"
                  style={{ display: 'block', fontSize: '0.62rem', lineHeight: 1.25 }}
                >
                  {entry.movies.join(', ')}
                </span>
              </span>
            )}
          </span>
          {index < Math.min(entries.length, limit) - 1 ? ', ' : ''}
        </span>
      )
    })
  }

  return (
    <section className="section">
      <div className="container has-text-centered mb-5">
        <h2 className="title">Archive</h2>
        <p className="subtitle">Past movie lists from previous meetups</p>
      </div>

      {!loading && lists.length > 0 && (
        <div className="container mb-5">
          <div className="columns is-multiline">
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ height: '100%', padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Archive winner</p>
                <p className="title is-5 mb-1" style={{ lineHeight: 1.1 }}>
                  {archiveStats.topWinners[0]?.name ?? 'None yet'}
                </p>
                <p className="has-text-grey is-size-7 mb-0" style={{ lineHeight: 1.2 }}>
                  {archiveStats.topWinners.length > 0
                    ? [
                        `${archiveStats.topWinners[0].count} selected ${
                          archiveStats.topWinners[0].count === 1 ? 'list' : 'lists'
                        }`,
                        ...archiveStats.topWinners
                          .slice(1)
                          .map(
                            (winner) =>
                              `${winner.name} (${winner.count} selected ${
                                winner.count === 1 ? 'list' : 'lists'
                              })`
                          ),
                      ].join(', ')
                    : 'No archived winners'}
                </p>
              </div>
            </div>
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ height: '100%', padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Most seen actors</p>
                <p className="title is-6 mb-1" style={{ lineHeight: 1.15 }}>
                  {renderHoverableEntries(archiveStats.topActors, 'No actor data', 'actor', 10)}
                </p>
                <p className="has-text-grey is-size-7 mb-0" style={{ lineHeight: 1.2 }}>
                  Numbers show archived movie appearances
                </p>
              </div>
            </div>
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ height: '100%', padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Most seen directors</p>
                <p className="title is-6 mb-1" style={{ lineHeight: 1.15 }}>
                  {renderHoverableEntries(
                    archiveStats.topDirectors,
                    'No director data',
                    'director',
                    10
                  )}
                </p>
                <p className="has-text-grey is-size-7 mb-0" style={{ lineHeight: 1.2 }}>
                  Numbers show archived movie appearances
                </p>
              </div>
            </div>
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ height: '100%', padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Top languages</p>
                <p className="title is-6 mb-1" style={{ lineHeight: 1.15 }}>
                  {renderHoverableEntries(
                    archiveStats.topLanguages,
                    'No language data',
                    'language',
                    archiveStats.topLanguages.length
                  )}
                </p>
                <p className="has-text-grey is-size-7 mb-0" style={{ lineHeight: 1.2 }}>
                  {archiveStats.englishMovieCount + archiveStats.nonEnglishMovieCount > 0
                    ? (() => {
                        const totalLanguageCount =
                          archiveStats.englishMovieCount + archiveStats.nonEnglishMovieCount
                        const englishPercentage = Math.round(
                          (archiveStats.englishMovieCount / totalLanguageCount) * 100
                        )
                        const nonEnglishPercentage = Math.round(
                          (archiveStats.nonEnglishMovieCount / totalLanguageCount) * 100
                        )

                        return `${archiveStats.englishMovieCount} English / ${archiveStats.nonEnglishMovieCount} non-English (${englishPercentage}% / ${nonEnglishPercentage}%)`
                      })()
                    : 'No language ratio yet'}
                </p>
              </div>
            </div>
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ height: '100%', padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Archived meetups</p>
                <p className="title is-4 mb-0" style={{ lineHeight: 1.05 }}>
                  {archiveStats.listCount}
                </p>
              </div>
            </div>
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ height: '100%', padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Movie appearances</p>
                <p className="title is-4 mb-0" style={{ lineHeight: 1.05 }}>
                  {archiveStats.totalMovieCount}
                </p>
              </div>
            </div>
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ height: '100%', padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Avg time per week</p>
                <p className="title is-4 mb-0" style={{ lineHeight: 1.05 }}>
                  {formatMinutes(Math.round(archiveStats.averageRuntimePerWeek))}
                </p>
              </div>
            </div>
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Avg time per list</p>
                <p className="title is-4 mb-0" style={{ lineHeight: 1.05 }}>
                  {formatMinutes(Math.round(archiveStats.averageRuntimePerList))}
                </p>
              </div>
            </div>
            <div className="column is-12-mobile is-4-desktop">
              <div className="box" style={{ padding: '0.5rem 1.1rem' }}>
                <p className="heading mb-1">Total runtime</p>
                <p className="title is-4 mb-0" style={{ lineHeight: 1.05 }}>
                  {formatMinutes(archiveStats.totalRuntimeMinutes)}
                </p>
              </div>
            </div>
            <div className="column is-12">
              <div className="box" style={{ padding: '0.75rem 1.1rem' }}>
                <p className="heading mb-2">Archived movies by release year</p>
                {archiveStats.yearCounts.length === 0 ? (
                  <p className="has-text-grey is-size-7 mb-0">No release year data</p>
                ) : (
                  <div
                    style={{
                      overflowX: 'hidden',
                      overflowY: 'visible',
                      paddingTop: '3.25rem',
                      paddingBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        minWidth: '0',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        paddingRight: '2px',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '28px minmax(0, 1fr)',
                          gap: '0.3rem',
                          width: '100%',
                          minWidth: '0',
                          maxWidth: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                      <div
                        style={{
                          position: 'relative',
                          height: '220px',
                        }}
                      >
                        {archiveStats.yearTicks.map((tick) => {
                          const bottom =
                            archiveStats.yearTicks[archiveStats.yearTicks.length - 1] === 0
                              ? 0
                              : (tick / archiveStats.yearTicks[archiveStats.yearTicks.length - 1]) *
                                100
                          return (
                            <div
                              key={tick}
                              style={{
                                position: 'absolute',
                                bottom: `${bottom}%`,
                                right: 0,
                                transform: 'translateY(50%)',
                                fontSize: '0.58rem',
                                color: '#7a7a7a',
                                lineHeight: 1,
                              }}
                            >
                              {tick}
                            </div>
                          )
                        })}
                      </div>
                      <div>
                        <div
                          style={{
                            position: 'relative',
                            height: '220px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '2px',
                            padding: '0 6px 0 0',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.14)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
                            overflow: 'visible',
                            touchAction: 'none',
                          }}
                          onTouchStart={(e) => {
                            const touch = e.touches[0]
                            if (!touch) return
                            setHoveredYearFromTouch(touch.clientX, touch.clientY)
                          }}
                          onTouchMove={(e) => {
                            const touch = e.touches[0]
                            if (!touch) return
                            setHoveredYearFromTouch(touch.clientX, touch.clientY)
                          }}
                          onTouchEnd={() => setHoveredYear(null)}
                          onTouchCancel={() => setHoveredYear(null)}
                        >
                          {archiveStats.yearTicks.map((tick) => {
                            const bottom =
                              archiveStats.yearTicks[archiveStats.yearTicks.length - 1] === 0
                                ? 0
                                : (tick / archiveStats.yearTicks[archiveStats.yearTicks.length - 1]) *
                                  100
                            return (
                              <div
                                key={tick}
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  bottom: `${bottom}%`,
                                  borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                                }}
                              />
                            )
                          })}
                          {archiveStats.yearCounts.map((entry, index) => (
                            <div
                              key={entry.year}
                              data-year-slot={entry.year}
                              style={{
                                flex: '1 1 0',
                                minWidth: '0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                height: '100%',
                                position: 'relative',
                                zIndex: hoveredYear === entry.year ? 20 : 1,
                              }}
                              onMouseEnter={() => setHoveredYear(entry.year)}
                              onMouseLeave={() =>
                                setHoveredYear((current) => (current === entry.year ? null : current))
                              }
                            >
                              {hoveredYear === entry.year && entry.count > 0 && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    left:
                                      index <= 1
                                        ? '0'
                                        : index >= archiveStats.yearCounts.length - 2
                                          ? 'auto'
                                          : '50%',
                                    right:
                                      index >= archiveStats.yearCounts.length - 2 ? '0' : 'auto',
                                    bottom: `min(calc(${
                                      Math.max(
                                        4,
                                        (entry.count /
                                          archiveStats.yearTicks[
                                            archiveStats.yearTicks.length - 1
                                          ]) *
                                          100
                                      )
                                    }% + 10px), calc(100% - 12px))`,
                                    transform:
                                      index <= 1 || index >= archiveStats.yearCounts.length - 2
                                        ? 'translateX(0)'
                                        : 'translateX(-50%)',
                                    width: '180px',
                                    padding: '0.45rem 0.55rem',
                                    background: '#20242d',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                                    textAlign: 'left',
                                    pointerEvents: 'none',
                                    zIndex: 10,
                                  }}
                                >
                                  <div
                                    className="has-text-white"
                                    style={{ fontSize: '0.68rem', fontWeight: 600, marginBottom: '0.25rem' }}
                                  >
                                    {entry.year} · {entry.count}
                                  </div>
                                  <div
                                    className="has-text-grey-light"
                                    style={{ fontSize: '0.62rem', lineHeight: 1.25 }}
                                  >
                                    {entry.movies.join(', ')}
                                  </div>
                                </div>
                              )}
                              <div
                                style={{
                                  width: '100%',
                                  height: `${(entry.count / archiveStats.yearTicks[archiveStats.yearTicks.length - 1]) * 100}%`,
                                  minHeight: '2px',
                                  background: 'linear-gradient(180deg, #48c78e, #3e8ed0)',
                                  borderRadius: '4px 4px 0 0',
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '2px',
                            padding: '0.25rem 6px 0 0',
                          }}
                        >
                          {archiveStats.yearCounts.map((entry, index) => {
                            const showLabel =
                              index === 0 ||
                              index === archiveStats.yearCounts.length - 1 ||
                              entry.year % 10 === 0

                            return (
                              <div
                                key={entry.year}
                                className="has-text-grey-light is-size-7"
                                style={{
                                  flex: '1 1 0',
                                  minWidth: '0',
                                  textAlign: 'center',
                                  fontSize: '0.52rem',
                                  lineHeight: 1,
                                }}
                              >
                                {showLabel ? entry.year : ''}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isReady && (
        <div className="navbar is-dark is-fixed-bottom is-hidden-desktop">
          <div
            className="is-flex is-justify-content-center"
            style={{
              padding: '0.75rem',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
            }}
          >
            <FilterSortControls
              filter={filter}
              sortBy={sortBy}
              onFilterChangeAction={setFilter}
              onSortChangeAction={setSortBy}
              variant="compact"
            />
          </div>
        </div>
      )}

      {!isReady || loading ? (
        <p>Loading archive...</p>
      ) : filteredAndSortedLists.length === 0 ? (
        <p className="has-text-centered has-text-grey">No archived lists match your filters</p>
      ) : (
        <div
          className="fixed-grid has-1-cols-mobile	has-2-cols-tablet has-3-cols-widescreen"
          style={{ paddingBottom: '5rem' }}
        >
          <div className="grid is-row-gap-5 is-column-gap-4 is-multiline">
            {filteredAndSortedLists.map((l) => (
              <div key={l.id} className="cell">
                <ListCard
                  list={l}
                  actions={{
                    onEdit: () => {},
                    onDelete: () => {},
                    onToggleSeen,
                  }}
                  display={{
                    isArchiveView: true,
                    initialCommentCount: l.commentCount,
                    showNominatedBy: true,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default function ArchivePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArchivePageContent />
    </Suspense>
  )
}
