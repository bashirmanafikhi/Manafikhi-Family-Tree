import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Person, PersonWithRelations } from '../types';
import { getFamilyTree, getPersonById, getChildren, getParents, getSpouses } from '../services/database';

interface FamilyContextType {
  persons: PersonWithRelations[];
  isLoading: boolean;
  error: string | null;
  getPersonById: (id: string) => Promise<PersonWithRelations | null>;
  getChildren: (personId: string) => Promise<Person[]>;
  getParents: (personId: string) => Promise<{ father?: Person; mother?: Person }>;
  getSpouses: (personId: string) => Promise<Person[]>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [persons, setPersons] = useState<PersonWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      
      const tree = await getFamilyTree();
      setPersons(Array.from(tree.persons.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  async function getPersonByIdHandler(id: string): Promise<PersonWithRelations | null> {
    const person = await getPersonById(id);
    if (!person) return null;
    
    const [children, spouses, parents] = await Promise.all([
      getChildren(id),
      getSpouses(id),
      getParents(id),
    ]);
    
    return {
      ...person,
      ...parents,
      children,
      spouses,
    };
  }

  return (
    <FamilyContext.Provider value={{
      persons,
      isLoading,
      error,
      getPersonById: getPersonByIdHandler,
      getChildren,
      getParents,
      getSpouses,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}