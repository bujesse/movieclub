'use client'

import { ListFilter, ListSort } from '../types/lists'

export default function FilterSortControls({
  filter,
  sortBy,
  onFilterChangeAction,
  onSortChangeAction,
  variant = 'default',
}: {
  filter: ListFilter
  sortBy: ListSort
  onFilterChangeAction: (filter: ListFilter) => void
  onSortChangeAction: (sort: ListSort) => void
  variant?: 'default' | 'compact'
}) {
  const isCompact = variant === 'compact'
  const buttonSize = isCompact ? 'is-small' : ''

  return (
    <div className="is-flex is-align-items-center" style={{ gap: '0.5rem' }}>
      {/* Filter Buttons */}
      <div className="buttons has-addons mb-0">
        <button
          className={`button ${buttonSize} ${filter === ListFilter.All ? 'is-primary is-selected' : ''}`}
          onClick={() => onFilterChangeAction(ListFilter.All)}
        >
          All
        </button>
        <button
          className={`button ${buttonSize} ${filter === ListFilter.MyLists ? 'is-primary is-selected' : ''}`}
          onClick={() => onFilterChangeAction(ListFilter.MyLists)}
        >
          My Lists
        </button>
        <button
          className={`button ${buttonSize} ${filter === ListFilter.Voted ? 'is-primary is-selected' : ''}`}
          onClick={() => onFilterChangeAction(ListFilter.Voted)}
        >
          My Votes
        </button>
      </div>

      {/* Sort Dropdown */}
      <div className={`select ${buttonSize}`}>
        <select value={sortBy} onChange={(e) => onSortChangeAction(e.target.value as ListSort)}>
          <option value={ListSort.Default}>Default</option>
          <option value={ListSort.MostSeen}>Most Seen</option>
          <option value={ListSort.LeastSeen}>Least Seen</option>
          <option value={ListSort.CreatedDesc}>Newest</option>
          <option value={ListSort.CreatedAsc}>Oldest</option>
          <option value={ListSort.VotesDesc}>All-time Votes</option>
        </select>
      </div>
    </div>
  )
}
