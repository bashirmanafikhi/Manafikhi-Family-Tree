'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PersonDropdown } from '@/components/person/person-dropdown'

interface PersonOption {
  id: string
  label: string
  firstName: string
  lastName?: string
  gender: 'MALE' | 'FEMALE'
}

interface MarriageFormProps {
  currentPersonId: string
  currentPersonGender: string
  onMarriageCreated?: () => void
}

export function MarriageForm({ currentPersonId, currentPersonGender, onMarriageCreated }: MarriageFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showNewPersonForm, setShowNewPersonForm] = useState(false)

  const [formData, setFormData] = useState({
    spouseId: '',
    startDate: '',
    endDate: '',
    isCurrent: true,
    notes: '',
  })

  const [newPersonData, setNewPersonData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
  })

  const handleCreateNewSpouse = async () => {
    if (!newPersonData.firstName) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newPersonData.firstName,
          lastName: newPersonData.lastName || null,
          gender: currentPersonGender === 'MALE' ? 'FEMALE' : 'MALE',
          birthDate: newPersonData.birthDate || null,
          isAlive: true,
        }),
      })

      if (res.ok) {
        const newPerson = await res.json()
        setFormData({ ...formData, spouseId: newPerson.id })
        
        const res2 = await fetch('/api/marriages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            person1Id: currentPersonId,
            person2Id: newPerson.id,
            startDate: formData.startDate || null,
            endDate: formData.isCurrent ? null : (formData.endDate || null),
            isCurrent: formData.isCurrent,
            notes: formData.notes || null,
          }),
        })

        if (res2.ok) {
          setShowForm(false)
          setShowNewPersonForm(false)
          setFormData({
            spouseId: '',
            startDate: '',
            endDate: '',
            isCurrent: true,
            notes: '',
          })
          setNewPersonData({ firstName: '', lastName: '', birthDate: '' })
          router.refresh()
          onMarriageCreated?.()
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.spouseId) return
    
    setIsSubmitting(true)
    try {
      const person1Id = currentPersonId
      const person2Id = formData.spouseId

      const res = await fetch('/api/marriages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1Id,
          person2Id,
          startDate: formData.startDate || null,
          endDate: formData.isCurrent ? null : (formData.endDate || null),
          isCurrent: formData.isCurrent,
          notes: formData.notes || null,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({
          spouseId: '',
          startDate: '',
          endDate: '',
          isCurrent: true,
          notes: '',
        })
        router.refresh()
        onMarriageCreated?.()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="btn-primary w-full justify-center"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        إضافة {currentPersonGender === 'MALE' ? 'زوجة' : 'زوج'}
      </button>
    )
  }

  if (showNewPersonForm) {
    return (
      <div className="space-y-4 p-4 rounded-xl" style={{ background: '#f0ede8' }}>
        <h3 className="font-semibold" style={{ color: '#2d2926' }}>
          إضافة {currentPersonGender === 'MALE' ? 'زوجة جديدة' : 'زوج جديد'}
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
              الاسم الأول *
            </label>
            <input
              type="text"
              required
              value={newPersonData.firstName}
              onChange={(e) => setNewPersonData({ ...newPersonData, firstName: e.target.value })}
              className="input-field"
              placeholder={currentPersonGender === 'MALE' ? 'اسم الزوجة' : 'اسم الزوج'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
              الاسم الأخير
            </label>
            <input
              type="text"
              value={newPersonData.lastName}
              onChange={(e) => setNewPersonData({ ...newPersonData, lastName: e.target.value })}
              className="input-field"
              placeholder="اسم العائلة"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
            تاريخ الميلاد
          </label>
          <input
            type="date"
            value={newPersonData.birthDate}
            onChange={(e) => setNewPersonData({ ...newPersonData, birthDate: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>تاريخ الزواج</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="input-field"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isCurrent"
            checked={formData.isCurrent}
            onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
            className="w-5 h-5 rounded"
          />
          <label htmlFor="isCurrent" className="font-medium" style={{ color: '#2d2926' }}>
            الزواج الحالي
          </label>
        </div>

        {!formData.isCurrent && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>تاريخ الانفصال</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="input-field"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>ملاحظات</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input-field"
            rows={2}
            placeholder="ملاحظات حول العلاقة..."
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={handleCreateNewSpouse} disabled={isSubmitting || !newPersonData.firstName} className="btn-primary flex-1">
            {isSubmitting ? 'جاري...' : 'حفظ وزواج'}
          </button>
          <button type="button" onClick={() => { setShowNewPersonForm(false); setNewPersonData({ firstName: '', lastName: '', birthDate: '' }) }} className="btn-outline">
            إلغاء
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-xl" style={{ background: '#f0ede8' }}>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
          اختر {currentPersonGender === 'MALE' ? 'الزوجة' : 'الزوج'} *
        </label>
        <PersonDropdown
          value={formData.spouseId}
          onChange={(val) => setFormData({ ...formData, spouseId: val || '' })}
          excludeIds={[currentPersonId]}
          filterGender={currentPersonGender === 'MALE' ? 'FEMALE' : 'MALE'}
          placeholder={`اختر ${currentPersonGender === 'MALE' ? 'الزوجة' : 'الزوج'}...`}
        />
      </div>

      {!formData.spouseId && (
        <button
          type="button"
          onClick={() => setShowNewPersonForm(true)}
          className="btn-outline w-full justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          إضافة {currentPersonGender === 'MALE' ? 'زوجة جديدة' : 'زوج جديد'}
        </button>
      )}

      {formData.spouseId && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>تاريخ الزواج</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCurrent"
              checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <label htmlFor="isCurrent" className="font-medium" style={{ color: '#2d2926' }}>
              الزواج الحالي
            </label>
          </div>

          {!formData.isCurrent && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>تاريخ الانفصال</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>ملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="ملاحظات حول العلاقة..."
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting || !formData.spouseId} className="btn-primary flex-1">
              {isSubmitting ? 'جاري...' : 'إضافة'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
              إلغاء
            </button>
          </div>
        </>
      )}
    </form>
  )
}