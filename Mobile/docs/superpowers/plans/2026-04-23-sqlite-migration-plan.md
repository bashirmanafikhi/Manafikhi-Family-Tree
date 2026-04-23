# SQLite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Manafikhi Family Tree app to read all data from SQLite database instead of Obsidian canvas and markdown files.

**Architecture:** Add expo-sqlite, create database service, refactor FamilyContext, update tree visualization to use fatherId/motherId relationships.

**Tech Stack:** Expo SDK 54, expo-sqlite, TypeScript, React Native

---

## File Structure

```
package.json                     # Add expo-sqlite dependency
src/types/index.ts              # Update Person types
src/services/database.ts       # Create: SQLite service with queries
src/context/FamilyContext.tsx # Modify: Load from SQLite
app/index.tsx                 # Modify: Tree visualization
app/person/[id].tsx           # Modify: Person details
```

---

## Task 1: Install Dependencies

- [ ] **Step 1: Install expo-sqlite**

```bash
npm install expo-sqlite
```

- [ ] **Step 2: Verify install**

```bash
npm list expo-sqlite
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/index.ts:1-71`

**Purpose:** Replace Canvas/Markdown types with SQLite-compatible Person types

- [ ] **Step 1: Update types**

Replace the entire file content with:

```typescript
export interface Person {
  id: string;
  firstName: string;
  lastName?: string;
  gender: 'm' | 'f';
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
}

export interface FamilyTree {
  persons: Map<string, PersonWithRelations>;
  rootIds: string[];
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

---

## Task 3: Create Database Service

**Files:**
- Create: `src/services/database.ts`

**Purpose:** Create SQLite service to query persons, children, parents, spouses

- [ ] **Step 1: Create database service**

Write the file with these functions:

```typescript
import * as SQLite from 'expo-sqlite';
import { Person, PersonWithRelations, FamilyTree } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('dev.db');
  return db;
}

export async function getAllPersons(): Promise<Person[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Person>('SELECT * FROM Person');
  return result.map(p => ({
    ...p,
    additionalImages: p.additionalImages ? JSON.parse(p.additionalImages) : [],
  }));
}

export async function getPersonById(id: string): Promise<Person | null> {
  const database = await initDatabase();
  const result = await database.getFirstAsync<Person>(
    'SELECT * FROM Person WHERE id = ?',
    [id]
  );
  if (!result) return null;
  return {
    ...result,
    additionalImages: result.additionalImages ? JSON.parse(result.additionalImages) : [],
  };
}

export async function getChildren(parentId: string): Promise<Person[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Person>(
    'SELECT * FROM Person WHERE fatherId = ? OR motherId = ?',
    [parentId, parentId]
  );
  return result.map(p => ({
    ...p,
    additionalImages: p.additionalImages ? JSON.parse(p.additionalImages) : [],
  }));
}

export async function getParents(personId: string): Promise<{ father?: Person; mother?: Person }> {
  const person = await getPersonById(personId);
  if (!person) return {};
  
  const [father, mother] = await Promise.all([
    person.fatherId ? getPersonById(person.fatherId) : Promise.resolve(null),
    person.motherId ? getPersonById(person.motherId) : Promise.resolve(null),
  ]);
  
  return { father: father || undefined, mother: mother || undefined };
}

export async function getSpouses(personId: string): Promise<Person[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<{ person2Id: string }>(
    'SELECT person2Id FROM Marriage WHERE person1Id = ?',
    [personId]
  );
  
  const spousePromises = result.map(r => getPersonById(r.person2Id));
  const spouses = await Promise.all(spousePromises);
  return spouses.filter((s): s is Person => s !== null);
}

export async function getRootPersons(): Promise<Person[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Person>(
    'SELECT * FROM Person WHERE fatherId IS NULL AND motherId IS NULL'
  );
  return result.map(p => ({
    ...p,
    additionalImages: p.additionalImages ? JSON.parse(p.additionalImages) : [],
  }));
}

export async function getFamilyTree(): Promise<FamilyTree> {
  const persons = await getAllPersons();
  const personMap = new Map<string, PersonWithRelations>();
  
  for (const person of persons) {
    const [children, spouses, { father, mother }] = await Promise.all([
      getChildren(person.id),
      getSpouses(person.id),
      getParents(person.id),
    ]);
    
    personMap.set(person.id, {
      ...person,
      father,
      mother,
      children,
      spouses,
    });
  }
  
  const rootIds = persons
    .filter(p => !p.fatherId && !p.motherId)
    .map(p => p.id);
  
  return { persons: personMap, rootIds };
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

---

## Task 4: Refactor Family Context

**Files:**
- Modify: `src/context/FamilyContext.tsx:1-119`

**Purpose:** Load from SQLite instead of canvas/markdown

- [ ] **Step 1: Replace context**

Replace the entire file with:

```typescript
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

---

## Task 5: Refactor Tree Screen

**Files:**
- Modify: `app/index.tsx:1-346`

**Purpose:** Update tree to use fatherId/motherId instead of canvas edges

- [ ] **Step 1: Replace tree screen**

Replace the entire file with simplified tree using SQLite data:

```typescript
import React, { useState, useMemo, ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useFamily } from '../src/context/FamilyContext';
import { useTheme } from '../src/context/ThemeContext';
import { PersonWithRelations } from '../src/types';

const GENDER_COLORS = {
  m: '#5b9',
  f: '#bc6798',
};

export default function TreeScreen() {
  const { persons, isLoading, getChildren, error } = useFamily();
  const { colors } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const childrenMap = useMemo(() => {
    const map = new Map<string, PersonWithRelations[]>();
    persons.forEach(p => {
      map.set(p.id, p.children || []);
    });
    return map;
  }, [persons]);

  const spouseMap = useMemo(() => {
    const map = new Map<string, PersonWithRelations[]>();
    persons.forEach(p => {
      map.set(p.id, p.spouses || []);
    });
    return map;
  }, [persons]);

  const parentMap = useMemo(() => {
    const map = new Map<string, { fatherId?: string; motherId?: string }>();
    persons.forEach(p => {
      map.set(p.id, { fatherId: p.fatherId, motherId: p.motherId });
    });
    return map;
  }, [persons]);

  const findAncestors = (personId: string): string[] => {
    const ancestors: string[] = [];
    let current = parentMap.get(personId);
    while (current?.fatherId || current?.motherId) {
      if (current.fatherId) ancestors.push(current.fatherId);
      if (current.motherId) ancestors.push(current.motherId);
      current = parentMap.get(current.fatherId || current.motherId!);
    }
    return ancestors;
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { personsToShow: new Set<string>(), rootIds: [] as string[] };
    const query = searchQuery.trim().toLowerCase();
    
    const matchingIds = new Set<string>();
    const personsToShow = new Set<string>();

    persons.forEach(p => {
      const fullName = `${p.firstName} ${p.lastName || ''}`.trim().toLowerCase();
      if (fullName.includes(query)) {
        matchingIds.add(p.id);
      }
    });

    matchingIds.forEach(id => {
      personsToShow.add(id);
      findAncestors(id).forEach(a => personsToShow.add(a));
      const spouses = spouseMap.get(id) || [];
      spouses.forEach(s => personsToShow.add(s.id));
    });

    const rootIds = Array.from(personsToShow).filter(id => {
      const parent = parentMap.get(id);
      return (!parent?.fatherId && !parent?.motherId) || !personsToShow.has(parent.fatherId || '') || !personsToShow.has(parent.motherId || '');
    });

    return { personsToShow, rootIds };
  }, [persons, searchQuery, parentMap, spouseMap]);

  const rootNodeIds = useMemo(() => {
    return persons
      .filter(p => !p.fatherId && !p.motherId)
      .map(p => p.id);
  }, [persons]);

  React.useEffect(() => {
    if (searchQuery.trim() && searchResults.personsToShow.size > 0) {
      setExpanded(Array.from(searchResults.personsToShow));
    }
  }, [searchQuery, searchResults]);

  const filteredRootIds = searchQuery.trim() ? searchResults.rootIds : rootNodeIds;

  const togglePerson = (personId: string) => {
    setExpanded(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const handlePersonPress = (personId: string) => {
    router.push(`/person/${encodeURIComponent(personId)}`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#bc6798" />
        <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>جاري تحميل الشجرة...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5" style={{ backgroundColor: colors.background }}>
        <Text className="text-lg text-center" style={{ color: '#c00' }}>{error}</Text>
      </View>
    );
  }

  const renderPerson = (personId: string, level: number, visiblePersons?: Set<string>): ReactNode => {
    const person = persons.find(p => p.id === personId);
    if (!person) return null;

    let children = childrenMap.get(personId) || [];
    if (visiblePersons) {
      children = children.filter(c => visiblePersons.has(c.id));
    }
    const spouses = spouseMap.get(personId) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expanded.includes(personId);
    const bgColor = GENDER_COLORS[person.gender] || GENDER_COLORS.m;
    const fullName = `${person.firstName} ${person.lastName || ''}`.trim() || '(بدون اسم)';

    const renderSpouse = (spouse: PersonWithRelations): ReactNode => {
      const spouseName = `${spouse.firstName} ${spouse.lastName || ''}`.trim();
      const spouseBgColor = GENDER_COLORS[spouse.gender] || GENDER_COLORS.f;
      
      return (
        <TouchableOpacity
          key={spouse.id}
          className="flex-row items-center p-3 rounded-lg mb-0.5 mr-1"
          style={{ backgroundColor: spouseBgColor, flexDirection: 'row' }}
          onPress={() => handlePersonPress(spouse.id)}
        >
          <Text
            className="flex-1 text-sm font-bold text-white"
            numberOfLines={1}
            style={{ textAlign: 'left' }}
          >
            {spouseName}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View key={personId} className="mb-1">
        <TouchableOpacity
          className="flex-row items-center p-3 rounded-lg mb-0.5"
          style={{ 
            backgroundColor: bgColor, 
            marginLeft: 10,
            flexDirection: 'row'
          }}
          onPress={() => hasChildren && togglePerson(personId)}
        >
          <TouchableOpacity
            onPress={() => handlePersonPress(personId)}
            className="flex-row items-center flex-1"
          >
            <Text
              className="flex-1 text-sm font-bold text-white"
              numberOfLines={1}
              style={{ textAlign: 'left' }}
            >
              {fullName}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center min-w-[45px] justify-end">
            {hasChildren && (
              <>
                <View className="bg-black/10 rounded-full px-2 py-0.5 mr-2">
                  <Text className="text-[10px] font-bold text-white">
                    {children.length}
                  </Text>
                </View>
                <View className="w-3 items-center">
                  <Text className="text-[10px] text-white/80">
                    {isExpanded ? '▼' : '◀'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>

        {spouses.length > 0 && (
          <View className="flex-row mr-2">
            {spouses.map(spouse => renderSpouse(spouse))}
          </View>
        )}

        {isExpanded && hasChildren && (
          <View
            className="border-l-2 pt-1"
            style={{ borderColor: '#bc6798', marginLeft: 10 }}
          >
            {children.map((child, idx) => renderPerson(child.id, level + 1, visiblePersons))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-3 border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-2">
          <TextInput
            className="flex-1 p-2.5 rounded-lg text-base"
            style={{ backgroundColor: colors.card, color: colors.text, textAlign: 'right' }}
            placeholder="بحث..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          {persons.length} أعضاء
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="p-4">
          {filteredRootIds.map(rootId => renderPerson(rootId, 0, searchQuery.trim() ? searchResults.personsToShow : undefined))}
        </View>
      </ScrollView>

      <View className="p-3 pb-12 border-t" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <TouchableOpacity onPress={() => router.push('/settings')} className="flex-row justify-center items-center py-2">
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>الإعدادات</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

---

## Task 6: Enhance Person Details Screen

**Files:**
- Modify: `app/person/[id].tsx:1-124`

**Purpose:** Show gender, dates, children, parents, spouses, isAlive status

- [ ] **Step 1: Replace person details screen**

Replace the entire file with:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useFamily } from '../../src/context/FamilyContext';
import { useTheme } from '../../src/context/ThemeContext';
import { PersonWithRelations } from '../../src/types';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { getPersonById, getParents, getSpouses } = useFamily();
  const { colors } = useTheme();
  const [person, setPerson] = useState<PersonWithRelations | null>(null);
  const [parents, setParents] = useState<{ father?: PersonWithRelations; mother?: PersonWithRelations }>({});
  const [spouses, setSpouses] = useState<PersonWithRelations[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPerson() {
      if (!id) return;
      setIsLoading(true);
      const decodedId = decodeURIComponent(id);
      const found = await getPersonById(decodedId);
      if (found) {
        setPerson(found);
        navigation.setOptions({ title: `${found.firstName} ${found.lastName || ''}` });
        
        const [parentsData, spousesData] = await Promise.all([
          getParents(decodedId),
          getSpouses(decodedId),
        ]);
        setParents(parentsData);
        setSpouses(spousesData);
      }
      setIsLoading(false);
    }
    loadPerson();
  }, [id]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#bc6798" />
      </View>
    );
  }

  if (!person) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <Text className="text-lg" style={{ color: colors.text }}>الشخص غير موجود</Text>
      </View>
    );
  }

  const allImages = [person.profileImage, ...(person.additionalImages || [])].filter(Boolean) as string[];
  const hasMultipleImages = allImages.length > 1;

  const renderRelation = (relPerson: PersonWithRelations | undefined, label: string) => {
    if (!relPerson) return null;
    const fullName = `${relPerson.firstName} ${relPerson.lastName || ''}`.trim();
    return (
      <TouchableOpacity
        className="flex-1 p-3 rounded-lg m-1"
        style={{ backgroundColor: colors.card, minWidth: 120 }}
        onPress={() => router.push(`/person/${encodeURIComponent(relPerson.id)}`)}
      >
        <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{label}</Text>
        <Text className="text-base font-semibold" style={{ color: colors.text }}>{fullName}</Text>
        <Text className="text-xs" style={{ color: relPerson.gender === 'm' ? '#5b9' : '#bc6798' }}>
          {relPerson.gender === 'm' ? '👨' : '👩'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      {hasMultipleImages ? (
        <View className="w-full aspect-square">
          <Image
            source={{ uri: allImages[currentImageIndex] }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="flex-row justify-center items-center p-2.5">
            {allImages.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                className="w-2 h-2 rounded-full mx-1"
                style={{ backgroundColor: idx === currentImageIndex ? '#bc6798' : '#ccc' }}
                onPress={() => setCurrentImageIndex(idx)}
              />
            ))}
          </View>
        </View>
      ) : allImages.length === 1 ? (
        <Image
          source={{ uri: allImages[0] }}
          className="w-full aspect-square"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full aspect-square justify-center items-center" style={{ backgroundColor: colors.surface }}>
          <Text className="text-7xl">
            {person.gender === 'm' ? '👨' : '👩'}
          </Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-2xl font-bold text-center" style={{ color: colors.text }}>
          {person.firstName} {person.lastName || ''}
        </Text>
        
        <View className="flex-row flex-wrap justify-center mt-5 gap-3">
          {person.birthDate && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>تاريخ الميلاد</Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>{person.birthDate}</Text>
            </View>
          )}
          
          {!person.isAlive && person.deathDate && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>تاريخ الوفاة</Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>{person.deathDate}</Text>
            </View>
          )}
          
          {person.isAlive && (
            <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>الحالة</Text>
              <Text className="text-base font-semibold" style={{ color: '#5b9' }}>على قيد الحياة</Text>
            </View>
          )}
          
          <View className="p-3 rounded-lg min-w-[100]" style={{ backgroundColor: colors.surface }}>
            <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>الجنس</Text>
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {person.gender === 'm' ? 'ذكر' : 'أنثى'}
            </Text>
          </View>
        </View>

        {(parents.father || parents.mother) && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>الوالدان</Text>
            <View className="flex-row flex-wrap">
              {renderRelation(parents.father, 'الأب')}
              {renderRelation(parents.mother, 'الأم')}
            </View>
          </View>
        )}

        {spouses.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>الزوج/ة</Text>
            <View className="flex-row flex-wrap">
              {spouses.map(spouse => (
                <View key={spouse.id} className="flex-1 p-3 rounded-lg m-1" style={{ backgroundColor: colors.card, minWidth: 120 }}>
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {spouse.firstName} {spouse.lastName || ''}
                  </Text>
                  <Text className="text-xs" style={{ color: spouse.gender === 'm' ? '#5b9' : '#bc6798' }}>
                    {spouse.gender === 'm' ? '👨' : '👩'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {person.children && person.children.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>الأبناء ({person.children.length})</Text>
            <View className="flex-row flex-wrap">
              {person.children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  className="p-3 rounded-lg m-1"
                  style={{ backgroundColor: colors.card, minWidth: 120 }}
                  onPress={() => router.push(`/person/${encodeURIComponent(child.id)}`)}
                >
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {child.firstName} {child.lastName || ''}
                  </Text>
                  <Text className="text-xs" style={{ color: child.gender === 'm' ? '#5b9' : '#bc6798' }}>
                    {child.gender === 'm' ? '👨' : '👩'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {person.bio && (
          <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>السيرة الذاتية</Text>
            <Text className="text-base leading-6" style={{ color: colors.textSecondary }}>{person.bio}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Fix missing import**

Add `import { router } from 'expo-router';` after the other imports.

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

---

## Task 7: Verify Build

**Files:**
- All modified

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Run Expo build**

```bash
npx expo export --platform android
```

Expected: Successful export

---