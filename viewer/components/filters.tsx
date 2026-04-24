'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Filters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [gender, setGender] = useState(searchParams.get('gender') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [fatherName, setFatherName] = useState(searchParams.get('father') || '')
  const [motherName, setMotherName] = useState(searchParams.get('mother') || '')

  useEffect(() => {
    const params = new URLSearchParams()
    if (gender) params.set('gender', gender)
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    if (fatherName) params.set('father', fatherName)
    if (motherName) params.set('mother', motherName)
    
    const query = params.toString()
    router.push(`/persons${query ? `?${query}` : ''}`)
  }, [gender, status, search, fatherName, motherName, router])

  return (
    <div className="card mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>الجنس</label>
          <select 
            value={gender} 
            onChange={(e) => setGender(e.target.value)}
            className="input-field"
          >
            <option value="">الكل</option>
            <option value="MALE">ذكر</option>
            <option value="FEMALE">أنثى</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>الحالة</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="input-field"
          >
            <option value="">الكل</option>
            <option value="alive">حي</option>
            <option value="deceased">متوفى</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>الاسم</label>
          <input
            type="text"
            placeholder="ابحث بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>اسم الأب</label>
          <input
            type="text"
            placeholder="ابحث باسم الأب..."
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>اسم الأم</label>
          <input
            type="text"
            placeholder="ابحث باسم الأم..."
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
            className="input-field"
          />
        </div>
      </div>
    </div>
  )
}