import Link from "next/link";
import { getData } from "@/lib/data";

async function getPerson(id: string) {
  const { persons, marriages } = getData();
  const person = persons.find(p => p.id === id);

  if (!person) return null;

  const enrichedPerson = {
    ...person,
    father: person.fatherId ? persons.find(p => p.id === person.fatherId) : null,
    mother: person.motherId ? persons.find(p => p.id === person.motherId) : null,
  };

  const siblings: any[] = [];
  
  if (person.fatherId) {
    const fathersChildren = persons.filter(p => p.fatherId === person.fatherId && p.id !== person.id);
    siblings.push(...fathersChildren.map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, gender: c.gender })));
  }
  
  if (person.motherId) {
    const mothersChildren = persons.filter(p => p.motherId === person.motherId && p.id !== person.id);
    siblings.push(...mothersChildren.map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, gender: c.gender })));
  }
  
  const uniqueSiblings = siblings.filter((s, index, self) => index === self.findIndex(x => x.id === s.id));

  const childrenOfFather = persons.filter(p => p.fatherId === person.id);
  const childrenOfMother = persons.filter(p => p.motherId === person.id);
  
  const marriagesAsPerson1 = marriages.filter(m => m.person1Id === person.id);
  const marriagesAsPerson2 = marriages.filter(m => m.person2Id === person.id);

  return { person: enrichedPerson, siblings: uniqueSiblings, childrenOfFather, childrenOfMother, marriagesAsPerson1, marriagesAsPerson2 };
}

export default async function PersonDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const data = await getPerson(params.id)
  
  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/persons" className="btn-ghost mb-6 inline-flex">
          ← العودة للقائمة
        </Link>
        <div className="card text-center py-12">
          <p className="text-lg" style={{ color: '#6b6560' }}>الشخص غير موجود</p>
        </div>
      </div>
    )
  }

  const { person, siblings, childrenOfFather, childrenOfMother, marriagesAsPerson1, marriagesAsPerson2 } = data
  
  const children = [
    ...(childrenOfFather || []),
    ...(childrenOfMother || []),
  ]
  const uniqueChildren = children.filter((c, index, self) => index === self.findIndex(t => t.id === c.id))

  const spouses = [
    ...(marriagesAsPerson1 || []).map((m: any) => {
      const spouse = persons.find(p => p.id === m.person2Id);
      return spouse ? { ...spouse, isCurrent: m.isCurrent } : null;
    }).filter(Boolean),
    ...(marriagesAsPerson2 || []).map((m: any) => {
      const spouse = persons.find(p => p.id === m.person1Id);
      return spouse ? { ...spouse, isCurrent: m.isCurrent } : null;
    }).filter(Boolean),
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/persons" className="btn-ghost mb-6 inline-flex">
        ← العودة للقائمة
      </Link>

      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ${
            person.gender === 'MALE' 
              ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
              : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
          }`}>
            {person.firstName.charAt(0)}
          </div>
          
          <div className="flex-1 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold" style={{ color: '#2d2926' }}>
                {person.firstName} {person.lastName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm ${
                person.isAlive 
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
                ? `الميلاد: ${new Date(person.birthDate).toLocaleDateString('ar')}`
                : ''}
              {!person.isAlive && person.deathDate 
                ? ` - الوفاة: ${new Date(person.deathDate).toLocaleDateString('ar')}`
                : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
            الوالدين
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm" style={{ color: '#9c9690' }}>الأب</label>
              {person.father ? (
                <Link href={`/persons/${person.father.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-[#0d5c63] to-[#14919b]">
                    {person.father.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                      {person.father.firstName} {person.father.lastName}
                    </p>
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]">
                    {person.mother.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#e07a5f]" style={{ color: '#2d2926' }}>
                      {person.mother.firstName} {person.mother.lastName}
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm p-3" style={{ color: '#9c9690' }}>غير محدد</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#e07a5f' }}>
            الأزواج ({spouses.length})
          </h2>
          
          {spouses.length > 0 ? (
            <ul className="space-y-3">
              {spouses.map((spouse: any) => (
                <li key={spouse.id}>
                  <Link href={`/persons/${spouse.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      spouse.gender === 'MALE' 
                        ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
                        : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                    }`}>
                      {spouse.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                        {spouse.firstName} {spouse.lastName}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        spouse.isCurrent 
                          ? 'bg-[#e6f4ef] text-[#4a9d7c]' 
                          : 'bg-[#f0ede8] text-[#6b6560]'
                      }`}>
                        {spouse.isCurrent ? 'حالي' : 'سابق'}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: '#9c9690' }}>لا يوجد ازواج</p>
          )}
        </div>
      </div>

      <div className="card p-6 mt-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
          الأبناء ({uniqueChildren.length})
        </h2>
        
        {uniqueChildren.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uniqueChildren.map((child: any) => (
              <Link key={child.id} href={`/persons/${child.id}`} className="p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    child.gender === 'MALE' 
                      ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
                      : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                  }`}>
                    {child.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
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
          <p className="text-sm" style={{ color: '#9c9690' }}>لا يوجد أبناء</p>
        )}
      </div>

      {siblings.length > 0 && (
        <div className="card p-6 mt-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
            الاخوة ({siblings.length})
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {siblings.map((sibling: any) => (
              <Link key={sibling.id} href={`/persons/${sibling.id}`} className="p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    sibling.gender === 'MALE' 
                      ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
                      : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                  }`}>
                    {sibling.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
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
    </div>
  )
}