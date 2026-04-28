'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { compressImage, blobToFile } from '@/lib/image-utils';
import { Avatar } from '@/components/ui/avatar'
import { PersonDropdown } from '@/components/person/person-dropdown'
import { MarriageForm } from '@/components/forms/marriage-form'
import FamilyTree from '@/components/FamilyTree'
import GenerationStatsTable from '@/components/GenerationStatsTable'

interface PersonDetailProps {
  person: {
    id: string
    firstName: string
    lastName: string | null
    nickname: string | null
    gender: string
    birthDate: Date | string | null
    deathDate: Date | string | null
    isAlive: boolean
    profileImage: string | null
    additionalImages: string | null
    bio: string | null
    father?: { id: string; firstName: string; lastName: string | null; profileImage: string | null } | null
    mother?: { id: string; firstName: string; lastName: string | null; profileImage: string | null } | null
    childrenOfFather?: Array<{ id: string; firstName: string; lastName: string | null; gender: string; profileImage: string | null }>
    childrenOfMother?: Array<{ id: string; firstName: string; lastName: string | null; gender: string; profileImage: string | null }>
    marriagesAsPerson1?: Array<{ id: string; person2: { id: string; firstName: string; lastName: string | null; gender: string; profileImage: string | null }; isCurrent: boolean }>
    marriagesAsPerson2?: Array<{ id: string; person1: { id: string; firstName: string; lastName: string | null; gender: string; profileImage: string | null }; isCurrent: boolean }>
  }
  siblings: Array<{ id: string; firstName: string; lastName: string | null; gender: string; profileImage: string | null }>
  allPersons: Array<{
    id: string
    firstName: string
    lastName: string | null
    gender: string
    isAlive: boolean
    profileImage: string | null
    fatherId: string | null
    motherId: string | null
  }>
  treePerson: {
    id: string
    firstName: string
    lastName: string | null
    gender: string
    isAlive: boolean
    profileImage: string | null
    fatherId: string | null
    motherId: string | null
  }
}

export function PersonDetail({ person, siblings, allPersons, treePerson }: PersonDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [fatherLabel, setFatherLabel] = useState('')
  const [motherLabel, setMotherLabel] = useState('')
  const [formData, setFormData] = useState({
    firstName: person.firstName,
    lastName: person.lastName || '',
    nickname: person.nickname || '',
    gender: person.gender,
    birthDate: person.birthDate ? new Date(person.birthDate).toISOString().split('T')[0] : '',
    deathDate: person.deathDate ? new Date(person.deathDate).toISOString().split('T')[0] : '',
    isAlive: person.isAlive,
    fatherId: person.father?.id || '',
    motherId: person.mother?.id || '',
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLinkingChild, setIsLinkingChild] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [selectedAdditionalImages, setSelectedAdditionalImages] = useState<File[]>([]);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch parent labels for dropdowns
  useEffect(() => {
    const fetchLabels = async () => {
      if (person.father?.id) {
        const res = await fetch(`/api/persons/${person.father.id}`)
        if (res.ok) {
          const p = await res.json()
          const label = [
            p.firstName,
            p.father?.firstName,
            p.lastName,
            p.mother?.firstName ? `(${p.mother.firstName})` : null,
          ]
            .filter(Boolean)
            .join(' ')
          setFatherLabel(label)
        }
      }
      if (person.mother?.id) {
        const res = await fetch(`/api/persons/${person.mother.id}`)
        if (res.ok) {
          const p = await res.json()
          const label = [
            p.firstName,
            p.father?.firstName,
            p.lastName,
            p.mother?.firstName ? `(${p.mother.firstName})` : null,
          ]
            .filter(Boolean)
            .join(' ')
          setMotherLabel(label)
        }
      }
    }
    fetchLabels()
  }, [person.father?.id, person.mother?.id])

  useEffect(() => {
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName || '',
      nickname: person.nickname || '',
      gender: person.gender,
      birthDate: person.birthDate ? new Date(person.birthDate).toISOString().split('T')[0] : '',
      deathDate: person.deathDate ? new Date(person.deathDate).toISOString().split('T')[0] : '',
      isAlive: person.isAlive,
      fatherId: person.father?.id || '',
      motherId: person.mother?.id || '',
    })
  }, [person])

  const handleProfileImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      const fileObj = blobToFile(compressed.blob, 'profile.jpg');
      setSelectedProfileImage(fileObj);
      setUploadPreview(URL.createObjectURL(compressed.blob));
    } catch (err) {
      console.error('Failed to compress image', err);
    }
  };

  const handleAdditionalImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const compressed = await Promise.all(files.map(f => compressImage(f)));
    const fileObjs = compressed.map((c, i) => blobToFile(c.blob, `${Date.now()}_${i}.jpg`));
    setSelectedAdditionalImages(prev => [...prev, ...fileObjs]);
  };

  const handleRemoveAdditionalPreview = (index: number) => {
    setSelectedAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      if (selectedProfileImage) {
        fd.append('profileImage', selectedProfileImage);
      }
      for (const file of selectedAdditionalImages) {
        fd.append('additionalImages', file);
      }
      const res = await fetch(`/api/persons/${person.id}/images`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        setSelectedProfileImage(null);
        setSelectedAdditionalImages([]);
        setUploadPreview(null);
        router.refresh();
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (type: 'profile' | 'gallery', index?: number) => {
    const url = `/api/persons/${person.id}/images?type=${type}${index !== undefined ? `&index=${index}` : ''}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    }
  };

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName || null,
        nickname: formData.nickname || null,
        gender: formData.gender,
        birthDate: formData.birthDate || null,
        deathDate: formData.isAlive ? null : (formData.deathDate || null),
        isAlive: formData.isAlive,
        fatherId: formData.fatherId || null,
        motherId: formData.motherId || null,
      }

      const res = await fetch(`/api/persons/${person.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        setIsEditing(false)
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الشخص؟')) return

    setIsDeleting(true)
    await fetch(`/api/persons/${person.id}`, { method: 'DELETE' })
    await router.refresh()
    router.push('/persons')
  }

  const handleLinkChild = async () => {
    if (!selectedChildId) return
    setIsLinking(true)
    try {
      const res = await fetch(`/api/persons/${selectedChildId}`)
      if (!res.ok) throw new Error('Person not found')
      const childData = await res.json()

      const updateData = {
        ...childData,
        fatherId: person.gender === 'MALE' ? person.id : (childData.father?.id || null),
        motherId: person.gender === 'FEMALE' ? person.id : (childData.mother?.id || null),
      }

      // Convert birth/death dates back to ISO strings if they are objects
      if (updateData.birthDate) updateData.birthDate = new Date(updateData.birthDate).toISOString().split('T')[0]
      if (updateData.deathDate) updateData.deathDate = new Date(updateData.deathDate).toISOString().split('T')[0]

      const updateRes = await fetch(`/api/persons/${selectedChildId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (updateRes.ok) {
        setIsLinkingChild(false)
        setSelectedChildId('')
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      alert('حدث خطأ أثناء ربط الطفل')
    } finally {
      setIsLinking(false)
    }
  }

  const children = [
    ...(person.childrenOfFather || []),
    ...(person.childrenOfMother || []),
  ]
  const uniqueChildren = children.filter((c, index, self) =>
    index === self.findIndex((t) => t.id === c.id)
  )

  const descendantGenerations = (() => {
    const getChildren = (parentId: string) =>
      allPersons.filter(p => p.fatherId === parentId || p.motherId === parentId)

    const buildGenerations = (personId: string, gen: number, result: Map<number, typeof allPersons>): Map<number, typeof allPersons> => {
      if (gen >= 6) return result
      const childPersons = getChildren(personId)
      const existing = result.get(gen) || []
      const unique = childPersons.filter(c => !existing.some(e => e.id === c.id))
      if (unique.length > 0) {
        result.set(gen, [...existing, ...unique])
      }
      childPersons.forEach(c => buildGenerations(c.id, gen + 1, result))
      return result
    }

    const map = buildGenerations(treePerson.id, 1, new Map())
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  })()

  const spouses = [
    ...(person.marriagesAsPerson1 || []).map(m => ({
      ...m.person2,
      isCurrent: m.isCurrent,
      marriageId: m.id
    })),
    ...(person.marriagesAsPerson2 || []).map(m => ({
      ...m.person1,
      isCurrent: m.isCurrent,
      marriageId: m.id
    })),
  ]

  const handleDeleteMarriage = async (marriageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الزواج؟')) return
    try {
      const res = await fetch(`/api/marriages/${marriageId}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleShareChildren = async (spouseId: string, spouseGender: string) => {
    if (!confirm('هل تريد ربط جميع أبناء هذا الشخص بالزوج/الزوجة أيضاً؟')) return

    const childrenToShare = [
      ...(person.childrenOfFather || []),
      ...(person.childrenOfMother || []),
    ]

    if (childrenToShare.length === 0) {
      alert('لا يوجد أبناء لمشاركتهم')
      return
    }

    try {
      let successCount = 0
      for (const child of childrenToShare) {
        // Get full child data first to avoid overwriting other fields
        const res = await fetch(`/api/persons/${child.id}`)
        if (!res.ok) continue
        const childData = await res.json()

        const updateData = {
          firstName: childData.firstName,
          lastName: childData.lastName,
          gender: childData.gender,
          birthDate: childData.birthDate ? new Date(childData.birthDate).toISOString().split('T')[0] : null,
          deathDate: childData.deathDate ? new Date(childData.deathDate).toISOString().split('T')[0] : null,
          isAlive: childData.isAlive,
          fatherId: spouseGender === 'MALE' ? spouseId : (childData.fatherId || childData.father?.id || null),
          motherId: spouseGender === 'FEMALE' ? spouseId : (childData.motherId || childData.mother?.id || null),
        }

        const updateRes = await fetch(`/api/persons/${child.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })

        if (updateRes.ok) successCount++
      }

      alert(`تم ربط ${successCount} أبناء بنجاح`)
      // Small delay to ensure DB revalidation is finished
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error(error)
      alert('حدث خطأ أثناء مشاركة الأبناء')
    }
  }

  // View Mode
  if (!isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link href="/persons" className="btn-ghost mb-6 inline-flex">
          ← العودة لقائمة الأفراد
        </Link>

        {/* Profile Header */}
        <div className="card p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <Avatar
                firstName={person.firstName}
                lastName={person.lastName}
                profileImage={person.profileImage}
                gender={person.gender}
                size="xl"
              />

            {/* Info */}
            <div className="flex-1 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-bold" style={{ color: '#2d2926' }}>
                  {person.firstName} {person.lastName}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm ${person.isAlive
                  ? 'bg-[#e6f4ef] text-[#4a9d7c]'
                  : 'bg-[#f5e6e6] text-[#d94f4f]'
                  }`}>
                  {person.isAlive ? 'حي' : 'متوفى'}
                </span>
              </div>
              {person.nickname && (
                <p className="text-lg" style={{ color: '#6b6560' }}>
                  ({person.nickname})
                </p>
              )}
              <p className="text-lg" style={{ color: '#6b6560' }}>
                {person.gender === 'MALE' ? 'ذكر' : 'أنثى'}
              </p>
              <p className="text-sm mt-1" style={{ color: '#9c9690' }}>
                {person.birthDate
                  ? `تاريخ الولادة: ${new Date(person.birthDate).toLocaleDateString('ar')}`
                  : ''}
                {!person.isAlive && person.deathDate
                  ? ` - تاريخ الوفاة: ${new Date(person.deathDate).toLocaleDateString('ar')}`
                  : ''}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                تعديل
              </button>
              <button onClick={handleDelete} className="btn-outline" style={{ borderColor: '#d94f4f', color: '#d94f4f' }} disabled={isDeleting}>
                {isDeleting ? 'جاري...' : 'حذف'}
              </button>
            </div>
          </div>

          {/* Additional Images Thumbnail Strip */}
          {person.additionalImages && (() => {
            try {
              const imgs = JSON.parse(person.additionalImages) as string[];
              if (imgs && imgs.length > 0) {
                return (
                  <div className="card p-4 mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {imgs.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => window.open(`/${img}`, '_blank')}
                          className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          <img src={`/${img}`} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch { }
            return null;
          })()}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Link href={`/persons/new?fatherId=${person.id}`} className="card p-4 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-primary">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-medium" style={{ color: '#2d2926' }}>إضافة طفل لهذا الشخص</span>
            </div>
          </Link>

          <Link href="/persons" className="card p-4 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-gold">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-medium" style={{ color: '#2d2926' }}>العودة لقائمة الأفراد</span>
            </div>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Marriages Section */}
          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#e07a5f' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              الزواج ({spouses.length})
            </h2>

            {spouses.length > 0 ? (
              <ul className="space-y-3 mb-4">
                {spouses.map((spouse: any) => (
                  <li key={spouse.id}>
                    <Link href={`/persons/${spouse.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={spouse.firstName}
                          lastName={spouse.lastName}
                          gender={spouse.gender}
                          profileImage={spouse.profileImage}
                        />
                        <div>
                          <p className="font-medium group-hover:text-[#0d5c63] transition-colors" style={{ color: '#2d2926' }}>
                            {spouse.firstName} {spouse.lastName}
                          </p>
                          <p className="text-xs" style={{ color: '#9c9690' }}>انقر للعرض</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs ${spouse.isCurrent
                          ? 'bg-[#e6f4ef] text-[#4a9d7c]'
                          : 'bg-[#f0ede8] text-[#6b6560]'
                          }`}>
                          {spouse.isCurrent ? 'حالي' : 'سابق'}
                        </span>

                        {/* Share Children Action */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareChildren(spouse.id, spouse.gender); }}
                          title="مشاركة الأبناء"
                          className="p-2 rounded-lg hover:bg-[#e0f2fe] text-[#0d5c63] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>

                        {/* Delete Marriage Action */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteMarriage(spouse.marriageId); }}
                          title="حذف الزواج"
                          className="p-2 rounded-lg hover:bg-[#fdecea] text-[#d94f4f] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm mb-4" style={{ color: '#9c9690' }}>لا يوجد ازواج</p>
            )}

            {/* Add Marriage Form */}
            <MarriageForm
              currentPersonId={person.id}
              currentPersonGender={person.gender}
            />
          </div>

          {/* Parents Section */}
          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              الوالدين
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm" style={{ color: '#9c9690' }}>الأب</label>
                {person.father ? (
                  <Link href={`/persons/${person.father.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                    <Avatar
                      firstName={person.father.firstName}
                      lastName={person.father.lastName}
                      gender="MALE"
                      profileImage={person.father.profileImage}
                    />
                    <div>
                      <p className="font-medium group-hover:text-[#0d5c63] transition-colors" style={{ color: '#2d2926' }}>
                        {person.father.firstName} {person.father.lastName}
                      </p>
                      <p className="text-xs" style={{ color: '#9c9690' }}>انقر للعرض</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm p-3" style={{ color: '#9c9690' }}>غير محدد</p>
                )}
              </div>

              <div>
                <label className="text-sm" style={{ color: '#9c9690' }}>الأم</label>
                {person.mother ? (
                  <Link href={`/persons/${person.mother.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                    <Avatar
                      firstName={person.mother.firstName}
                      lastName={person.mother.lastName}
                      gender="FEMALE"
                      profileImage={person.mother.profileImage}
                    />
                    <div>
                      <p className="font-medium group-hover:text-[#e07a5f] transition-colors" style={{ color: '#2d2926' }}>
                        {person.mother.firstName} {person.mother.lastName}
                      </p>
                      <p className="text-xs" style={{ color: '#9c9690' }}>انقر للعرض</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm p-3" style={{ color: '#9c9690' }}>غير محدد</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Children Section */}
        <div className="card p-6 mt-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110 4m0-4V4m0 6v2m0-6V4" />
            </svg>
            الأبناء ({uniqueChildren.length})
          </h2>

          {uniqueChildren.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {uniqueChildren.map((child: any) => (
                <Link key={child.id} href={`/persons/${child.id}`} className="p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={child.firstName}
                      lastName={child.lastName}
                      gender={child.gender}
                      profileImage={child.profileImage}
                    />
                    <div>
                      <p className="font-medium group-hover:text-[#0d5c63] transition-colors" style={{ color: '#2d2926' }}>
                        {child.firstName} {child.lastName}
                      </p>
                      <p className="text-xs" style={{ color: '#9c9690' }}>
                        {child.gender === 'MALE' ? 'ذكر' : 'أنثى'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: '#9c9690' }}>لا يوجد أبناء</p>
            </div>
          )}

          {/* Add/Link Child Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: '#ede8e0' }}>
            {!isLinkingChild ? (
              <>
                <Link href={`/persons/new?fatherId=${person.gender === 'MALE' ? person.id : ''}&motherId=${person.gender === 'FEMALE' ? person.id : ''}`} className="btn-primary flex-1 justify-center">
                  + إضافة طفل جديد
                </Link>
                <button
                  onClick={() => setIsLinkingChild(true)}
                  className="btn-outline flex-1 justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  ربط طفل موجود مسبقاً
                </button>
              </>
            ) : (
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: '#2d2926' }}>اختر طفلاً لربطه</h3>
                  <button onClick={() => setIsLinkingChild(false)} className="text-xs text-[#d94f4f]">إلغاء</button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <PersonDropdown
                      value={selectedChildId}
                      onChange={(val) => setSelectedChildId(val || '')}
                      excludeIds={[person.id, ...uniqueChildren.map(c => c.id)]}
                      placeholder="ابحث عن الشخص..."
                    />
                  </div>
                  <button
                    onClick={handleLinkChild}
                    disabled={!selectedChildId || isLinking}
                    className="btn-primary"
                  >
                    {isLinking ? 'جاري الربط...' : 'ربط'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Siblings Section - Full Width */}
        {siblings.length > 0 && (
          <div className="card p-6 mt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              الاخوة ({siblings.length})
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {siblings.map((sibling: any) => (
                <Link key={sibling.id} href={`/persons/${sibling.id}`} className="p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={sibling.firstName}
                      lastName={sibling.lastName}
                      gender={sibling.gender}
                      profileImage={sibling.profileImage}
                    />
                    <div>
                      <p className="font-medium group-hover:text-[#0d5c63] transition-colors" style={{ color: '#2d2926' }}>
                        {sibling.firstName} {sibling.lastName}
                      </p>
                      <p className="text-xs" style={{ color: '#9c9690' }}>
                        {sibling.gender === 'MALE' ? 'أخ' : 'أخت'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <GenerationStatsTable descendantGenerations={descendantGenerations} />
        <FamilyTree person={treePerson} allPersons={allPersons} />
      </div>
    )
  }

  // Edit Mode
  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/persons" className="btn-ghost mb-6 inline-flex">
        ← العودة لقائمة الأفراد
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-primary">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2d2926' }}>
              تعديل البيانات
            </h1>
            <p className="text-sm" style={{ color: '#6b6560' }}>
              قم بتعديل بيانات {person.firstName} {person.lastName}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>الاسم الأخير</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>اللقب</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="input-field"
                placeholder="الشيخ"
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${formData.gender === 'MALE'
                  ? 'border-[#0d5c63] bg-[#e0f2fe] text-[#0d5c63]'
                  : 'border-[#ede8e0] hover:border-[#0d5c63]/50'
                  }`}
              >
                <span className={`w-3 h-3 rounded-full ${formData.gender === 'MALE' ? 'bg-[#0d5c63]' : 'bg-[#9c9690]'}`} />
                ذكر
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'FEMALE' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${formData.gender === 'FEMALE'
                  ? 'border-[#e07a5f] bg-[#fce7f3] text-[#e07a5f]'
                  : 'border-[#ede8e0] hover:border-[#e07a5f]/50'
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
                onChange={(val) => setFormData({ ...formData, fatherId: val || '' })}
                excludeIds={[person.id]}
                filterGender="MALE"
                placeholder="اختر الأب..."
                initialLabel={fatherLabel}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>الأم</label>
              <PersonDropdown
                value={formData.motherId}
                onChange={(val) => setFormData({ ...formData, motherId: val || '' })}
                excludeIds={[person.id]}
                filterGender="FEMALE"
                placeholder="اختر الأم..."
                initialLabel={motherLabel}
              />
            </div>
          </div>

          {/* Alive Status */}
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

          {/* Images */}
          <div className="border-t pt-6" style={{ borderColor: '#ede8e0' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: '#2d2926' }}>الصور</h3>

            {/* Current Profile Image */}
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: '#6b6560' }}>صورة البروفايل</label>
              <div className="flex items-center gap-4">
                {person.profileImage ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={`/${person.profileImage}`} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteImage('profile')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-[#f0ede8] flex items-center justify-center text-[#9c9690]">
                    لا توجد صورة
                  </div>
                )}
                <label className="btn-outline cursor-pointer text-sm">
                  اختر صورة
                  <input type="file" accept="image/*" onChange={handleProfileImageSelect} className="hidden" />
                </label>
              </div>
              {uploadPreview && (
                <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden">
                  <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Current Additional Images */}
            {person.additionalImages && (() => {
              const imgs = JSON.parse(person.additionalImages) as string[];
              if (imgs.length > 0) {
                return (
                  <div className="mb-4">
                    <label className="block text-sm mb-2" style={{ color: '#6b6560' }}>صور إضافية ({imgs.length})</label>
                    <div className="flex flex-wrap gap-2">
                      {imgs.map((img: string, idx: number) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <img src={`/${img}`} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleDeleteImage('gallery', idx)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* New Additional Images */}
            <div className="mb-4">
              <label className="block text-sm mb-2" style={{ color: '#6b6560' }}>إضافة صور جديدة</label>
              <label className="btn-outline cursor-pointer text-sm">
                اختر ملفات
                <input type="file" accept="image/*" multiple onChange={handleAdditionalImagesSelect} className="hidden" />
              </label>
              {selectedAdditionalImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAdditionalImages.map((file, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveAdditionalPreview(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(selectedProfileImage || selectedAdditionalImages.length > 0) && (
              <button
                onClick={handleUploadImages}
                disabled={isUploading}
                className="btn-primary"
              >
                {isUploading ? 'جاري الرفع...' : 'رفع الصور'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t" style={{ borderColor: '#ede8e0' }}>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1 sm:flex-none">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الحفظ...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  حفظ التغييرات
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-outline flex-1 sm:flex-none"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}