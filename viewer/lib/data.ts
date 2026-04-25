import * as fs from 'fs';
import * as path from 'path';

export interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  gender: string;
  birthDate: string | null;
  deathDate: string | null;
  isAlive: boolean;
  profileImage: string | null;
  bio: string | null;
  fatherId: string | null;
  motherId: string | null;
  father?: { id: string; firstName: string; lastName: string | null } | null;
  mother?: { id: string; firstName: string; lastName: string | null } | null;
  childrenOfFather?: { id: string; firstName: string; lastName: string | null; gender: string }[];
  childrenOfMother?: { id: string; firstName: string; lastName: string | null; gender: string }[];
  marriagesAsPerson1?: Marriage[];
  marriagesAsPerson2?: Marriage[];
}

export interface Marriage {
  id: string;
  person1Id: string;
  person2Id: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  notes: string | null;
  person2?: { id: string; firstName: string; lastName: string | null; gender: string };
  person1?: { id: string; firstName: string; lastName: string | null; gender: string };
}

interface FamilyData {
  persons: Person[];
  marriages: Marriage[];
}

let cachedData: FamilyData | null = null;

export function getData(): FamilyData {
  if (cachedData) return cachedData;
  
  const filePath = path.join(process.cwd(), 'public', 'data', 'family.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as FamilyData;
  cachedData = data;
  return data;
}

export function getPersonById(id: string): Person | undefined {
  return getData().persons.find(p => p.id === id);
}

export function getPersons(): Person[] {
  return getData().persons;
}

export function getStats() {
  const persons = getPersons();
  return {
    totalPersons: persons.length,
    aliveCount: persons.filter(p => p.isAlive).length,
    deceasedCount: persons.filter(p => !p.isAlive).length,
    malesCount: persons.filter(p => p.gender === 'MALE').length,
    femalesCount: persons.filter(p => p.gender === 'FEMALE').length,
    manafikhiCount: persons.filter(p => p.lastName === 'منافيخي').length,
  };
}