'use client'

import Link from 'next/link'

interface PersonWithRelations {
  id: string
  firstName: string
  lastName: string | null
  gender: string
  profileImage: string | null
  birthDate: Date | string | null
  deathDate: Date | string | null
  isAlive: boolean
  father?: { id: string; firstName: string; lastName: string | null } | null
  mother?: { id: string; firstName: string; lastName: string | null } | null
}

interface PersonTableProps {
  persons: PersonWithRelations[]
}

export function PersonTable({ persons }: PersonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-light">
            <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الاسم</th>
            <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الجنس</th>
            <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>سنة الميلاد</th>
            <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الأب</th>
            <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الأم</th>
          </tr>
        </thead>
        <tbody>
          {persons.map((person, index) => (
            <tr 
              key={person.id} 
              className="border-b border-border-light hover:bg-surface-muted transition-colors"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <td className="px-4 py-3">
                <Link 
                  href={`/persons/${person.id}`} 
                  className="flex items-center gap-3 group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium overflow-hidden ${
                    !person.profileImage ? (person.gender === 'MALE' ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]') : ''
                  }`}>
                    {person.profileImage ? (
                      <img 
                        src={person.profileImage.startsWith('/') ? person.profileImage : '/' + person.profileImage} 
                        alt={person.firstName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      person.firstName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63] transition-colors" style={{ color: '#2d2926' }}>
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="text-xs" style={{ color: '#9c9690' }}>انقر للعرض</p>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  person.gender === 'MALE' 
                    ? 'bg-[#e0f2fe] text-[#0d5c63]' 
                    : 'bg-[#fce7f3] text-[#e07a5f]'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    person.gender === 'MALE' ? 'bg-[#0d5c63]' : 'bg-[#e07a5f]'
                  }`} />
                  {person.gender === 'MALE' ? 'ذكر' : 'أنثى'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: '#6b6560' }}>
                {person.birthDate ? new Date(person.birthDate).getFullYear() : '-'}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  person.isAlive 
                    ? 'bg-[#e6f4ef] text-[#4a9d7c]' 
                    : 'bg-[#f5e6e6] text-[#d94f4f]'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    person.isAlive ? 'bg-[#4a9d7c]' : 'bg-[#d94f4f]'
                  }`} />
                  {person.isAlive ? 'حي' : 'متوفى'}
                </span>
              </td>
              <td className="px-4 py-3">
                {person.father ? (
                  <Link 
                    href={`/persons/${person.father.id}`}
                    className="text-sm hover:text-[#0d5c63] underline decoration-dotted"
                    style={{ color: '#6b6560' }}
                  >
                    {person.father.firstName} {person.father.lastName}
                  </Link>
                ) : (
                  <span className="text-sm" style={{ color: '#9c9690' }}>-</span>
                )}
              </td>
              <td className="px-4 py-3">
                {person.mother ? (
                  <Link 
                    href={`/persons/${person.mother.id}`}
                    className="text-sm hover:text-[#0d5c63] underline decoration-dotted"
                    style={{ color: '#6b6560' }}
                  >
                    {person.mother.firstName} {person.mother.lastName}
                  </Link>
                ) : (
                  <span className="text-sm" style={{ color: '#9c9690' }}>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}