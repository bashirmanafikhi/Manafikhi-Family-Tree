import Link from "next/link";
import { getData } from "@/lib/data";
import FamilyTree from "@/components/FamilyTree";
import GenerationStatsTable from "@/components/GenerationStatsTable";
import { Avatar } from "@/components/avatar";

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
    siblings.push(...fathersChildren.map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, gender: c.gender, profileImage: c.profileImage, nickname: c.nickname, isAlive: c.isAlive, deathDate: c.deathDate, birthDate: c.birthDate })));
  }
  
  if (person.motherId) {
    const mothersChildren = persons.filter(p => p.motherId === person.motherId && p.id !== person.id);
    siblings.push(...mothersChildren.map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, gender: c.gender, profileImage: c.profileImage, nickname: c.nickname, isAlive: c.isAlive, deathDate: c.deathDate, birthDate: c.birthDate })));
  }
  
  const uniqueSiblings = siblings.filter((s, index, self) => index === self.findIndex(x => x.id === s.id));

  const childrenOfFather = persons.filter(p => p.fatherId === person.id).map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, gender: c.gender, profileImage: c.profileImage, nickname: c.nickname, isAlive: c.isAlive, deathDate: c.deathDate, birthDate: c.birthDate }));
  const childrenOfMother = persons.filter(p => p.motherId === person.id).map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, gender: c.gender, profileImage: c.profileImage, nickname: c.nickname, isAlive: c.isAlive, deathDate: c.deathDate, birthDate: c.birthDate }));
  
  const marriagesAsPerson1 = marriages.filter(m => m.person1Id === person.id).map(m => ({
    ...m,
    spouse: persons.find(p => p.id === m.person2Id)
  }));
  const marriagesAsPerson2 = marriages.filter(m => m.person2Id === person.id).map(m => ({
    ...m,
    spouse: persons.find(p => p.id === m.person1Id)
  }));

  return { person: enrichedPerson, siblings: uniqueSiblings, childrenOfFather, childrenOfMother, marriagesAsPerson1, marriagesAsPerson2, persons };
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

  const { person, siblings, childrenOfFather, childrenOfMother, marriagesAsPerson1, marriagesAsPerson2, persons } = data
  
  const children = [
    ...(childrenOfFather || []),
    ...(childrenOfMother || []),
  ]
  const uniqueChildren = children.filter((c, index, self) => index === self.findIndex(t => t.id === c.id))

  const descendantGenerations = (() => {
    const descendantsSet = new Set<string>();
    const queue = [person.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = persons.filter(p => p.fatherId === current || p.motherId === current);
      for (const child of children) {
        if (!descendantsSet.has(child.id)) {
          descendantsSet.add(child.id);
          queue.push(child.id);
        }
      }
    }

    const getChildren = (parentId: string) =>
      persons.filter(p => {
        if (p.fatherId === parentId) return true;
        if (p.motherId === parentId) {
          if (p.fatherId && (p.fatherId === person.id || descendantsSet.has(p.fatherId))) {
            return false;
          }
          return true;
        }
        return false;
      });

    const buildGenerations = (personId: string, gen: number, result: Map<number, typeof persons>): Map<number, typeof persons> => {
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

    const map = buildGenerations(person.id, 1, new Map())
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  })()

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
          <Avatar
            firstName={person.firstName}
            lastName={person.lastName}
            profileImage={person.profileImage}
            gender={person.gender}
            size="xl"
          />
          
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
        {person.additionalImages && (() => {
          try {
            const imgs = JSON.parse(person.additionalImages);
            if (imgs && imgs.length > 0) {
              return (
                <div className="card p-4 mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {imgs.map((img: string, idx: number) => (
                      <a
                        key={idx}
                        href={`/${img}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={`/${img}`} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            }
          } catch {}
          return null;
        })()}
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
                  <Avatar
                    firstName={person.father.firstName}
                    lastName={person.father.lastName}
                    gender="MALE"
                    profileImage={person.father.profileImage}
                  />
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                      {person.father.firstName} {person.father.lastName} {person.father.nickname ? `(${person.father.nickname})` : ''}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#9c9690' }}>
                      {person.father.isAlive ? 'حي' : 'متوفى'}
                      {person.father.birthDate && ` • ${new Date(person.father.birthDate).getFullYear()}`}
                      {!person.father.isAlive && person.father.deathDate && ` - ${new Date(person.father.deathDate).getFullYear()}`}
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
                  <Avatar
                    firstName={person.mother.firstName}
                    lastName={person.mother.lastName}
                    gender="FEMALE"
                    profileImage={person.mother.profileImage}
                  />
                  <div>
                    <p className="font-medium group-hover:text-[#e07a5f]" style={{ color: '#2d2926' }}>
                      {person.mother.firstName} {person.mother.lastName} {person.mother.nickname ? `(${person.mother.nickname})` : ''}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#9c9690' }}>
                      {person.mother.isAlive ? 'حي' : 'متوفى'}
                      {person.mother.birthDate && ` • ${new Date(person.mother.birthDate).getFullYear()}`}
                      {!person.mother.isAlive && person.mother.deathDate && ` - ${new Date(person.mother.deathDate).getFullYear()}`}
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
                    <Avatar
                      firstName={spouse.firstName}
                      lastName={spouse.lastName}
                      gender={spouse.gender}
                      profileImage={spouse.profileImage}
                    />
                    <div>
                      <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                        {spouse.firstName} {spouse.lastName} {spouse.nickname ? `(${spouse.nickname})` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          spouse.isCurrent 
                            ? 'bg-[#e6f4ef] text-[#4a9d7c]' 
                            : 'bg-[#f0ede8] text-[#6b6560]'
                        }`}>
                          {spouse.isCurrent ? 'حالي' : 'سابق'}
                        </span>
                        <span className="text-xs" style={{ color: '#9c9690' }}>
                          {spouse.isAlive ? 'حي' : 'متوفى'}
                          {spouse.birthDate && ` • ${new Date(spouse.birthDate).getFullYear()}`}
                          {!spouse.isAlive && spouse.deathDate && ` - ${new Date(spouse.deathDate).getFullYear()}`}
                        </span>
                      </div>
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
                  <Avatar
                    firstName={child.firstName}
                    lastName={child.lastName}
                    gender={child.gender}
                    profileImage={child.profileImage}
                  />
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                      {child.firstName} {child.lastName} {child.nickname ? `(${child.nickname})` : ''}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#9c9690' }}>
                      {child.gender === 'MALE' ? 'ذكر' : 'أنثى'} • {child.isAlive ? 'حي' : 'متوفى'}
                      {child.birthDate && ` • ${new Date(child.birthDate).getFullYear()}`}
                      {!child.isAlive && child.deathDate && ` - ${new Date(child.deathDate).getFullYear()}`}
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
                  <Avatar
                    firstName={sibling.firstName}
                    lastName={sibling.lastName}
                    gender={sibling.gender}
                    profileImage={sibling.profileImage}
                  />
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                      {sibling.firstName} {sibling.lastName} {sibling.nickname ? `(${sibling.nickname})` : ''}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#9c9690' }}>
                      {sibling.gender === 'MALE' ? 'أخ' : 'أخت'} • {sibling.isAlive ? 'حي' : 'متوفى'}
                      {sibling.birthDate && ` • ${new Date(sibling.birthDate).getFullYear()}`}
                      {!sibling.isAlive && sibling.deathDate && ` - ${new Date(sibling.deathDate).getFullYear()}`}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <GenerationStatsTable descendantGenerations={descendantGenerations} />
      <FamilyTree person={person} allPersons={persons} />
    </div>
  )
}