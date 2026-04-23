'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function PersonFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    replace(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, replace])

  return (
    <div className="flex flex-wrap gap-3">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9c9690' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="بحث بالاسم..."
            onChange={(e) => updateParam('search', e.target.value)}
            defaultValue={searchParams.get('search')?.toString()}
            className="input-field pr-10"
          />
        </div>
      </div>
      
      {/* Gender Filter */}
      <select
        onChange={(e) => updateParam('gender', e.target.value)}
        defaultValue={searchParams.get('gender')?.toString() || ''}
        className="input-field min-w-[120px]"
      >
        <option value="">كل الجنسين</option>
        <option value="MALE">ذكر</option>
        <option value="FEMALE">أنثى</option>
      </select>

      {/* Alive Filter */}
      <select
        onChange={(e) => updateParam('alive', e.target.value)}
        defaultValue={searchParams.get('alive')?.toString() || ''}
        className="input-field min-w-[120px]"
      >
        <option value="">الكل</option>
        <option value="true">أحياء</option>
        <option value="false">متوفين</option>
      </select>

      {/* Clear Filters */}
      {(searchParams.get('search') || searchParams.get('gender') || searchParams.get('alive')) && (
        <button
          onClick={() => replace(pathname)}
          className="btn-ghost text-sm"
          style={{ color: '#d94f4f' }}
        >
          مسح الفلاتر
        </button>
      )}
    </div>
  )
}