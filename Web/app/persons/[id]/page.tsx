import { prisma } from '@/lib/prisma'
import { PersonDetail } from '@/components/person/person-detail'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getPerson(id: string) {
  return prisma.person.findUnique({
    where: { id },
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
      childrenOfFather: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      childrenOfMother: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      marriagesAsPerson1: {
        include: {
          person2: { select: { id: true, firstName: true, lastName: true, gender: true } },
        },
      },
      marriagesAsPerson2: {
        include: {
          person1: { select: { id: true, firstName: true, lastName: true, gender: true } },
        },
      },
    },
  })
}

export default async function PersonPage({
  params,
}: {
  params: { id: string }
}) {
  const person = await getPerson(params.id)

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#f0ede8' }}>
            <svg className="w-8 h-8" style={{ color: '#9c9690' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#2d2926' }}>
            الشخص غير موجود
          </h1>
          <p className="text-sm mb-4" style={{ color: '#6b6560' }}>
            ربما تم حذف هذا الشخص من قاعدة البيانات
          </p>
          <Link href="/persons" className="btn-primary">
            العودة لقائمةIndividuals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PersonDetail person={person} />
    </div>
  )
}