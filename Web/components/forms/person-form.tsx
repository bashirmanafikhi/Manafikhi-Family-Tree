'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PersonDropdown } from '@/components/person/person-dropdown'

interface PersonFormProps {
  prefillFather?: string
  prefillMother?: string
}

interface PersonInfo {
  id: string
  firstName: string
  lastName: string | null
  father?: { firstName: string; lastName: string | null } | null
  mother?: { firstName: string } | null
}

export function PersonForm({ prefillFather, prefillMother }: PersonFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fatherLabel, setFatherLabel] = useState('')
  const [motherLabel, setMotherLabel] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    fatherId: prefillFather || undefined,
    motherId: prefillMother || undefined,
    isAlive: true,
    birthDate: '',
    deathDate: '',
  })

  // Fetch initial labels for pre-selected parents
  useEffect(() => {
    const fetchParentLabel = async (id: string, setLabel: (label: string) => void) => {
      const res = await fetch(`/api/persons/${id}`)
      if (res.ok) {
        const person = await res.json()
        setLabel(`${person.firstName} ${person.lastName || ''}`)
      }
    }

    if (prefillFather) fetchParentLabel(prefillFather, setFatherLabel)
    if (prefillMother) fetchParentLabel(prefillMother, setMotherLabel)
  }, [prefillFather, prefillMother])

  const handleSubmit = async (action: 'continue' | 'addChild' | 'addSibling') => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to create')

      const person = await res.json()

      if (action === 'continue') {
        router.push('/persons')
      } else if (action === 'addChild') {
        router.push(`/persons/new?fatherId=${person.id}&motherId=${formData.motherId || ''}`)
      } else if (action === 'addSibling') {
        router.push(
          `/persons/new?fatherId=${formData.fatherId || ''}&motherId=${formData.motherId || ''}`
        )
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm" style={{ color: '#6b6560' }}>
        <Link href="/" className="hover:text-[#0d5c63]">الرئيسية</Link>
        <span>/</span>
        <Link href="/persons" className="hover:text-[#0d5c63]">الأفراد</Link>
        <span>/</span>
        <span style={{ color: '#0d5c63' }}>إضافة جديد</span>
      </nav>

      {/* Form Card */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-primary"> 
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 9v3m0 0v3m0-3h3m-3 0H9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2d2926' }}>
              إضافة فرد جديد
            </h1>
            <p className="text-sm" style={{ color: '#6b6560' }}>
              أضف فرداً جديداً إلى شجرة العائلة
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit('continue')
          }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>الاسم الأول *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-field"
                placeholder="أحمد"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>الاسم الأخير</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-field"
                placeholder="المنافيخي"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>الجنس *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'MALE' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  formData.gender === 'MALE'
                    ? 'border-[#0d5c63] bg-[#e0f2fe] text-[#0d5c63]'
                    : 'border-border-light hover:border-[#0d5c63]/50'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${formData.gender === 'MALE' ? 'bg-[#0d5c63]' : 'bg-[#9c9690]'}`} />
               ذكر
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'FEMALE' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  formData.gender === 'FEMALE'
                    ? 'border-[#e07a5f] bg-[#fce7f3] text-[#e07a5f]'
                    : 'border-border-light hover:border-[#e07a5f]/50'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${formData.gender === 'FEMALE' ? 'bg-[#e07a5f]' : 'bg-[#9c9690]'}`} />
                أنثى
              </button>
            </div>
          </div>

          {/* Parents */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>الأب</label>
              <PersonDropdown
                value={formData.fatherId}
                onChange={(val) => setFormData({ ...formData, fatherId: val })}
                filterGender="MALE"
                placeholder="اختر الأب..."
                initialLabel={fatherLabel}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>الأم</label>
              <PersonDropdown
                value={formData.motherId}
                onChange={(val) => setFormData({ ...formData, motherId: val })}
                filterGender="FEMALE"
                placeholder="اختر الأم..."
                initialLabel={motherLabel}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#f0ede8' }}>
            <input
              type="checkbox"
              id="isAlive"
              checked={formData.isAlive}
              onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <label htmlFor="isAlive" className="font-medium" style={{ color: '#2d2926' }}>
              هذا الشخص على قيد الحياة
            </label>
          </div>

          {/* Dates */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>تاريخ الميلاد</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="input-field"
              />
            </div>
            {!formData.isAlive && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>تاريخ الوفاة</label>
                <input
                  type="date"
                  value={formData.deathDate}
                  onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border-light">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الحفظ...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  حفظ
                </span>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit('addChild')}
              disabled={isSubmitting}
              className="btn-secondary flex-1 sm:flex-none"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                حفظ وإضافة طفل
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit('addSibling')}
              disabled={isSubmitting}
              className="btn-outline flex-1 sm:flex-none"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                حفظ وإضافة أخ
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Links */}
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/persons" className="btn-ghost">
          ← قائمة الأفراد
        </Link>
        <Link href="/tree" className="btn-ghost">
          عرض الشجرة ←
        </Link>
      </div>
    </div>
  )
}