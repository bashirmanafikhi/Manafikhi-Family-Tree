export interface Person {
  id: string;
  firstName: string;
  lastName?: string;
  gender: 'MALE' | 'FEMALE';
  birthDate?: string;
  deathDate?: string;
  isAlive: boolean;
  profileImage?: string;
  additionalImages?: string[];
  bio?: string;
  fatherId?: string;
  motherId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PersonWithRelations extends Person {
  father?: Person;
  mother?: Person;
  children: Person[];
  spouses: Person[];
  siblings: Person[];
}

export interface FamilyTree {
  persons: Map<string, PersonWithRelations>;
  rootIds: string[];
}

export const GENDER_COLORS: Record<string, string> = {
  MALE: '#5b9',
  FEMALE: '#bc6798',
};