import { FamilyTree } from '@/components/tree/family-tree'
import Link from 'next/link'

export default function TreePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#0d5c63' }}>
            الشجرة المرئية
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            اعرض علاقات_family members بشكل مرئي
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/persons" className="btn-outline">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            قائمةIndividuals
          </Link>
          
          <Link href="/persons/new" className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            إضافة فرد
          </Link>
        </div>
      </div>

      {/* Tree Container */}
      <div className="card overflow-hidden">
        <FamilyTree />
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm" style={{ color: '#6b6560' }}>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-gradient-to-br from-[#0d5c63] to-[#14919b]" />
          <span>ذكر</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]" />
          <span>أنثى</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded ring-2 ring-[#4a9d7c]" />
          <span>حي</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded ring-2 ring-[#d94f4f]" />
          <span>متوفى</span>
        </div>
      </div>
    </div>
  )
}