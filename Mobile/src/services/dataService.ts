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

function addToIndex(map: Map<string, Person[]>, key: string, value: Person) {
  const list = map.get(key);
  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
}

const childrenByParent = new Map<string, Person[]>();
for (const p of persons) {
  if (p.fatherId) addToIndex(childrenByParent, p.fatherId, p);
  if (p.motherId) addToIndex(childrenByParent, p.motherId, p);
}

const spousesByPerson = new Map<string, Person[]>();
for (const m of rawMarriages) {
  const p1 = personMap.get(m.person1Id);
  const p2 = personMap.get(m.person2Id);
  if (p1 && p2) {
    addToIndex(spousesByPerson, m.person1Id, p2);
    addToIndex(spousesByPerson, m.person2Id, p1);
  }
}

function computeSiblings(person: Person): Person[] {
  if (!person.fatherId && !person.motherId) return [];
  const result: Person[] = [];
  const seen = new Set<string>([person.id]);
  if (person.fatherId) {
    for (const c of childrenByParent.get(person.fatherId) || []) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        result.push(c);
      }
    }
  }
  if (person.motherId) {
    for (const c of childrenByParent.get(person.motherId) || []) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        result.push(c);
      }
    }
  }
  return result;
}

export async function getAllPersons(): Promise<Person[]> {
  return persons;
}

export function getStats() {
  return {
    totalPersons: persons.length,
    aliveCount: persons.filter(p => p.isAlive).length,
    deceasedCount: persons.filter(p => !p.isAlive).length,
    malesCount: persons.filter(p => p.gender === 'MALE').length,
    femalesCount: persons.filter(p => p.gender === 'FEMALE').length,
    manafikhiCount: persons.filter(p => p.lastName === 'منافيخي').length,
  };
}

export async function getPersonById(id: string): Promise<Person | null> {
  return personMap.get(id) || null;
}

export async function getChildren(parentId: string): Promise<Person[]> {
  return childrenByParent.get(parentId) || [];
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
  return spousesByPerson.get(personId) || [];
}

export async function getSiblings(personId: string): Promise<Person[]> {
  const person = personMap.get(personId);
  if (!person) return [];
  return computeSiblings(person);
}

export async function getRootPersons(): Promise<Person[]> {
  return persons.filter(p => !p.fatherId && !p.motherId);
}

export async function getFamilyTree(): Promise<FamilyTree> {
  const treeMap = new Map<string, PersonWithRelations>();

  for (const person of persons) {
    treeMap.set(person.id, {
      ...person,
      father: person.fatherId ? personMap.get(person.fatherId) : undefined,
      mother: person.motherId ? personMap.get(person.motherId) : undefined,
      children: childrenByParent.get(person.id) || [],
      spouses: spousesByPerson.get(person.id) || [],
      siblings: computeSiblings(person),
    });
  }

  const rootIds = persons
    .filter(p => !p.fatherId && !p.motherId)
    .map(p => p.id);

  return { persons: treeMap, rootIds };
}
