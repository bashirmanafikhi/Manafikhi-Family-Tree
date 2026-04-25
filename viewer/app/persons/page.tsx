import Link from "next/link";
import { getPersons as getAllPersons } from "@/lib/data";
import { Filters } from "@/components/filters";

const PAGE_SIZE = 20;

async function getPersons(searchParams: {
  gender?: string;
  status?: string;
  search?: string;
  father?: string;
  mother?: string;
  page?: string;
}) {
  const allPersons = getAllPersons();
  
  const page = parseInt(searchParams.page || '1')
  const skip = (page - 1) * PAGE_SIZE

  let persons = [...allPersons]

  // Filter by gender
  if (searchParams.gender) {
    persons = persons.filter(p => p.gender === searchParams.gender)
  }

  // Filter by status
  if (searchParams.status === 'alive') {
    persons = persons.filter(p => p.isAlive)
  } else if (searchParams.status === 'deceased') {
    persons = persons.filter(p => !p.isAlive)
  }

  // Filter by search name
  if (searchParams.search) {
    const term = searchParams.search.toLowerCase()
    persons = persons.filter(p =>
      p.firstName.toLowerCase().includes(term) ||
      (p.lastName && p.lastName.toLowerCase().includes(term))
    )
  }

  // Filter by father name
  if (searchParams.father) {
    const term = searchParams.father.toLowerCase()
    persons = persons.filter(p =>
      p.father?.firstName?.toLowerCase().includes(term) ||
      (p.father?.lastName && p.father.lastName.toLowerCase().includes(term))
    )
  }

  // Filter by mother name
  if (searchParams.mother) {
    const term = searchParams.mother.toLowerCase()
    persons = persons.filter(p =>
      p.mother?.firstName?.toLowerCase().includes(term) ||
      (p.mother?.lastName && p.mother.lastName.toLowerCase().includes(term))
    )
  }

  const total = persons.length
  const paginatedPersons = persons.slice(skip, skip + PAGE_SIZE)

  return { persons: paginatedPersons, total, page, totalPages: Math.ceil(total / PAGE_SIZE) }
}

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: { gender?: string; status?: string; search?: string; father?: string; mother?: string; page?: string }
}) {
  const { persons, total, page, totalPages } = await getPersons(searchParams)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: '#0d5c63' }}>
        أفراد العائلة
      </h1>

      <Filters />

      <div className="card overflow-hidden p-4">
        <p className="mb-4 text-sm" style={{ color: '#6b6560' }}>
          عرض {persons.length} من {total} فرد
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الاسم</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الأب</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الأم</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الجنس</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((person) => (
                <tr key={person.id} className="border-b border-border-light hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/persons/${person.id}`}
                      className="flex items-center gap-3 group"
                    >
                      {person.profileImage ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={`/${person.profileImage}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          person.gender === 'MALE'
                            ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]'
                            : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                        }`}>
                          {person.firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                          {person.firstName} {person.lastName}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#6b6560' }}>
                    {person.father ? `${person.father.firstName} ${person.father.lastName || ''}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#6b6560' }}>
                    {person.mother ? `${person.mother.firstName} ${person.mother.lastName || ''}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${person.gender === 'MALE'
                        ? 'bg-[#e0f2fe] text-[#0d5c63]'
                        : 'bg-[#fce7f3] text-[#e07a5f]'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${person.gender === 'MALE' ? 'bg-[#0d5c63]' : 'bg-[#e07a5f]'
                        }`} />
                      {person.gender === 'MALE' ? 'ذكر' : 'أنثى'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${person.isAlive
                        ? 'bg-[#e6f4ef] text-[#4a9d7c]'
                        : 'bg-[#f5e6e6] text-[#d94f4f]'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${person.isAlive ? 'bg-[#4a9d7c]' : 'bg-[#d94f4f]'
                        }`} />
                      {person.isAlive ? 'حي' : 'متوفى'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {page > 1 && (
              <Link href={`/persons?page=${page - 1}`} className="btn-outline">
                السابق
              </Link>
            )}
            <span className="px-4" style={{ color: '#6b6560' }}>
              صفحة {page} من {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/persons?page=${page + 1}`} className="btn-outline">
                التالي
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}