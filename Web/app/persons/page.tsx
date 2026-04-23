import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PersonTable } from '@/components/person/person-table'
import { PersonFilters } from '@/components/person/person-filters'

export const dynamic = 'force-dynamic'

async function getPersons(search: string, gender?: string, isAlive?: boolean) {
  const where: any = {}
  
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
  }
  
  if (gender) where.gender = gender
  if (isAlive !== undefined) where.isAlive = isAlive

  return prisma.person.findMany({
    where,
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { firstName: 'asc' },
    take: 100,
  })
}

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: { search?: string; gender?: string; alive?: string }
}) {
  const search = searchParams.search || ''
  const gender = searchParams.gender || undefined
  const isAlive = searchParams.alive === 'true' ? true : searchParams.alive === 'false' ? false : undefined

  const persons = await getPersons(search, gender, isAlive)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#0d5c63' }}>
            أفراد العائلة
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            {persons.length} فرد في قاعدة البيانات
          </p>
        </div>
        
        <Link href="/persons/new" className="btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          إضافة فرد جديد
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <PersonFilters />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Suspense fallback={
          <div className="p-8 text-center" style={{ color: '#6b6560' }}>
            جاري التحميل...
          </div>
        }>
          {persons.length > 0 ? (
            <PersonTable persons={persons} />
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#f0ede8' }}>
                <svg className="w-8 h-8" style={{ color: '#9c9690' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#2d2926' }}>
                لا يوجد أفراد
              </h3>
              <p className="text-sm mb-4" style={{ color: '#6b6560' }}>
                ابدأ بإضافة الأفراد الأوائل إلى الشجرة
              </p>
              <Link href="/persons/new" className="btn-primary inline-flex">
                إضافة أول فرد
              </Link>
            </div>
          )}
        </Suspense>
      </div>

      {/* Pagination Info */}
      {persons.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm" style={{ color: '#6b6560' }}>
          <p>عرض {persons.length} نتيجة</p>
          <Link href="/" className="btn-ghost">
            ← العودة للرئيسية
          </Link>
        </div>
      )}
    </div>
  )
}