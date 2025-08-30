'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const DEBOUNCE_MS = 500

export default function Autocomplete<T>({
  placeholder,
  value,
  onChange,
  onSelect,
  fetchItems,
  getLabel,
}: {
  placeholder?: string
  value: string
  onChange: (v: string) => void
  onSelect: (item: T) => void
  fetchItems: (q: string) => Promise<T[]>
  getLabel: (item: T) => string
}) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<T[]>([])
  const [hi, setHi] = useState(0)
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listId = 'ac-list'

  // Position the dropdown under the input (portal uses fixed positioning)
  const updatePosition = () => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({ top: rect.bottom, left: rect.left, width: rect.width })
  }

  // Observe input focus/mount/resize/scroll to keep dropdown aligned
  useEffect(() => {
    updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('resize', onResize)

    // also watch the nearest scrolling ancestor (e.g., .modal-card-body)
    const scrollParent = inputRef.current?.closest('.modal-card-body') as HTMLElement | null
    const onScroll = () => updatePosition()
    scrollParent?.addEventListener('scroll', onScroll)
    document.addEventListener('scroll', onScroll, true) // capture other scrollables

    return () => {
      window.removeEventListener('resize', onResize)
      scrollParent?.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!inputRef.current) return
      const target = e.target as Node
      if (target === inputRef.current || inputRef.current.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setItems([])
      setOpen(false)
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetchItems(value)
        setItems(res)
        setOpen(true)
        setHi(0)
        updatePosition()
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current) // always returns void
      }
    }
  }, [value])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onSelect(items[hi])
      onChange('')
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="field" style={{ position: 'relative' }}>
      <div className={`control ${loading ? 'is-loading' : ''}`}>
        <input
          ref={inputRef}
          className="input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            updatePosition()
          }}
          onFocus={() => {
            if (items.length) setOpen(true)
            updatePosition()
          }}
          onKeyDown={handleKey}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
      </div>

      {/* Portal: render dropdown at document.body with fixed coords */}
      {open &&
        items.length > 0 &&
        createPortal(
          <div
            className="dropdown is-active"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 9999, // above Bulma modal
            }}
          >
            <div className="dropdown-menu" id={listId} role="listbox" style={{ width: '100%' }}>
              <div className="dropdown-content" style={{ maxHeight: 280, overflowY: 'auto' }}>
                {items.map((item, idx) => (
                  <a
                    key={(item as any).id ?? idx}
                    className={`dropdown-item ${idx === hi ? 'is-active' : ''}`}
                    onMouseEnter={() => setHi(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      onSelect(item)
                      onChange('')
                      setOpen(false)
                    }}
                  >
                    {getLabel(item)}
                  </a>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
