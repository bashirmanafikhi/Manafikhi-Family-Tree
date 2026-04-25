import familyData from '../../assets/family.json';
import { Person, PersonWithRelations, FamilyTree } from '../types';

interface RawPerson {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  gender: string;
  birthDate: string | null;
  deathDate: string | null;
  isAlive: boolean;
  profileImage: string | null;
  additionalImages: string;
  bio: string | null;
  fatherId: string | null;
  motherId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RawMarriage {
  id: string;
  person1Id: string;
  person2Id: string;
}

const rawPersons = familyData.persons as RawPerson[];
const rawMarriages = familyData.marriages as RawMarriage[];

function transformPerson(raw: RawPerson): Person {
  return {
    ...raw,
    lastName: raw.lastName || undefined,
    nickname: raw.nickname || undefined,
    gender: (raw.gender === 'm' || raw.gender === 'MALE') ? 'MALE' : 'FEMALE',
    birthDate: raw.birthDate || undefined,
    deathDate: raw.deathDate || undefined,
    profileImage: raw.profileImage || undefined,
    additionalImages: raw.additionalImages ? JSON.parse(raw.additionalImages) : [],
    bio: raw.bio || undefined,
    fatherId: raw.fatherId || undefined,
    motherId: raw.motherId || undefined,
    createdAt: new Date(raw.createdAt).getTime(),
    updatedAt: new Date(raw.updatedAt).getTime(),
  };
}

const persons: Person[] = rawPersons.map(transformPerson);
const personMap = new Map<string, Person>(persons.map(p => [p.id, p]));

export async function getAllPersons(): Promise<Person[]> {
  return persons;
}

export async function getPersonById(id: string): Promise<Person | null> {
  return personMap.get(id) || null;
}

export async function getChildren(parentId: string): Promise<Person[]> {
  return persons.filter(p => p.fatherId === parentId || p.motherId === parentId);
}

export async function getParents(personId: string): Promise<{ father?: Person; mother?: Person }> {
  const person = personMap.get(personId);
  if (!person) return {};

  return {
    father: person.fatherId ? personMap.get(person.fatherId) : undefined,
    mother: person.motherId ? personMap.get(person.motherId) : undefined,
  };
}

export async function getSpouses(personId: string): Promise<Person[]> {
  const spouseIds = rawMarriages
    .filter(m => m.person1Id === personId || m.person2Id === personId)
    .map(m => m.person1Id === personId ? m.person2Id : m.person1Id);

  return spouseIds
    .map(id => personMap.get(id))
    .filter((p): p is Person => p !== undefined);
}

export async function getSiblings(personId: string): Promise<Person[]> {
  const person = personMap.get(personId);
  if (!person) return [];

  const fatherId = person.fatherId;
  const motherId = person.motherId;

  if (!fatherId && !motherId) return [];

  return persons.filter(p => {
    if (p.id === personId) return false;
    if (fatherId && p.fatherId === fatherId) return true;
    if (motherId && p.motherId === motherId) return true;
    return false;
  });
}

export async function getRootPersons(): Promise<Person[]> {
  return persons.filter(p => !p.fatherId && !p.motherId);
}

export async function getFamilyTree(): Promise<FamilyTree> {
  const treeMap = new Map<string, PersonWithRelations>();

  for (const person of persons) {
    const [children, spouses, parents, siblings] = await Promise.all([
      getChildren(person.id),
      getSpouses(person.id),
      getParents(person.id),
      getSiblings(person.id),
    ]);

    treeMap.set(person.id, {
      ...person,
      ...parents,
      children,
      spouses,
      siblings,
    });
  }

  const rootIds = persons
    .filter(p => !p.fatherId && !p.motherId)
    .map(p => p.id);

  return { persons: treeMap, rootIds };
}
