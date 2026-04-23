'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface PersonOption {
  id: string
  label: string
  firstName: string
  lastName?: string
  gender: 'MALE' | 'FEMALE'
}

interface PersonDropdownProps {
  value?: string
  onChange: (value: string | undefined) => void
  excludeIds?: string[]
  filterGender?: 'MALE' | 'FEMALE' | 'ALL'
  placeholder: string
  initialLabel?: string
}

export function PersonDropdown({
  value,
  onChange,
  excludeIds = [],
  filterGender = 'ALL',
  placeholder,
  initialLabel,
}: PersonDropdownProps) {
  const [query, setQuery] = useState(initialLabel || '')
  const [options, setOptions] = useState<PersonOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize query from initialLabel only on mount
  useEffect(() => {
    if (initialLabel && value && !isLoaded) {
      setQuery(initialLabel)
      setIsLoaded(true)
    }
  }, [initialLabel, value, isLoaded])

  // Search function with proper cancellation
  const search = useCallback((searchQuery: string) => {
    if (searchQuery.length < 1) {
      setOptions([])
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    fetch(`/api/persons/search?q=${encodeURIComponent(searchQuery)}&limit=15&gender=${filterGender}`, {
      signal: controller.signal
    })
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((p: PersonOption) => !excludeIds.includes(p.id))
        setOptions(filtered)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err)
        }
      })
  }, [excludeIds, filterGender])

  // Debounced search
  useEffect(() => {
    // Don't search on initial load
    if (query === initialLabel && !isOpen) {
      return
    }

    const timeout = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, isOpen, initialLabel, search])

  const handleSelect = (option: PersonOption) => {
    onChange(option.id)
    setQuery(option.label)
    setIsOpen(false)
    setOptions([])
    setIsLoaded(true)
  }

  const handleClear = () => {
    onChange(undefined)
    setQuery('')
    setOptions([])
    setIsLoaded(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          setIsLoaded(false)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="input-field"
        autoComplete="off"
      />
      {value && query === initialLabel && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-sm hover:opacity-70"
          style={{ color: '#9c9690' }}
        >
          ✕
        </button>
      )}
      {isOpen && options.length > 0 && (
        <ul className="absolute z-10 w-full rounded-xl border border-border-light bg-white max-h-60 overflow-auto shadow-lg mt-1">
          {options.map((option) => (
            <li
              key={option.id}
              onClick={() => handleSelect(option)}
              className="p-3 hover:bg-[#f0ede8] cursor-pointer transition-colors flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                option.gender === 'MALE' 
                  ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
                  : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
              }`}>
                {option.firstName.charAt(0)}
              </div>
              <span className="font-medium" style={{ color: '#2d2926' }}>{option.label}</span>
            </li>
          ))}
        </ul>
      )}
      {isOpen && query.length > 2 && options.length === 0 && (
        <div className="absolute z-10 w-full rounded-xl border border-border-light bg-white p-4 shadow-lg mt-1 text-center" style={{ color: '#9c9690' }}>
          لا توجد نتائج
        </div>
      )}
    </div>
  )
}