import { Suspense } from 'react'
import { PersonForm } from '@/components/forms/person-form'

export default function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ fatherId?: string; motherId?: string }>
}) {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">إضافة شخص جديد</h1>
      
      <Suspense fallback={<div>Loading...</div>}>
        <PersonFormWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function PersonFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ fatherId?: string; motherId?: string }>
}) {
  const params = await searchParams
  return <PersonForm prefillFather={params.fatherId} prefillMother={params.motherId} />
}