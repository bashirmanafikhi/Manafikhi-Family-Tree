import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Person, PersonWithRelations, FamilyTree } from '../types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function transformPerson(raw: any): Person {
  return {
    ...raw,
    gender: (raw.gender === 'm' || raw.gender === 'MALE') ? 'MALE' : 'FEMALE',
    additionalImages: raw.additionalImages ? JSON.parse(raw.additionalImages as unknown as string) : [],
  };
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const dbName = 'dev.db';
    const dbDir = `${FileSystem.documentDirectory}SQLite`;
    const dbPath = `${dbDir}/${dbName}`;

    try {
      const fileInfo = await FileSystem.getInfoAsync(dbPath);

      if (fileInfo.exists) {
        console.log('Deleting existing database...');
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
      }

      console.log('Copying database from assets...');

      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      const asset = Asset.fromModule(require('../../assets/dev.db'));
      await asset.downloadAsync();

      if (asset.localUri) {
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: dbPath,
        });
        console.log('Database copied successfully to:', dbPath);
      } else {
        throw new Error('Failed to get local URI for database asset');
      }
    } catch (error) {
      console.error('Error handling database file:', error);
      // If copying fails, we still try to open it
    }

    return await SQLite.openDatabaseAsync(dbName);
  })();

  return dbPromise;
}

export async function getAllPersons(): Promise<Person[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Person>('SELECT * FROM Person');
  return result.map(p => transformPerson(p));
}

export async function getPersonById(id: string): Promise<Person | null> {
  const database = await initDatabase();
  const result = await database.getFirstAsync<Person>(
    'SELECT * FROM Person WHERE id = ?',
    [id]
  );
  if (!result) return null;
  return transformPerson(result);
}

export async function getChildren(parentId: string): Promise<Person[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Person>(
    'SELECT * FROM Person WHERE fatherId = ? OR motherId = ?',
    [parentId, parentId]
  );
  return result.map(p => transformPerson(p));
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

export async function getSiblings(personId: string): Promise<Person[]> {
  const person = await getPersonById(personId);
  if (!person) return [];
  
  const fatherId = person.fatherId || null;
  const motherId = person.motherId || null;
  
  if (!fatherId && !motherId) return [];

  const database = await initDatabase();
  let result: Person[] = [];

  if (fatherId && motherId) {
    result = await database.getAllAsync<Person>(
      'SELECT * FROM Person WHERE id != ? AND (fatherId = ? OR motherId = ?)',
      [personId, fatherId, motherId]
    );
  } else if (fatherId) {
    result = await database.getAllAsync<Person>(
      'SELECT * FROM Person WHERE id != ? AND fatherId = ?',
      [personId, fatherId]
    );
  } else if (motherId) {
    result = await database.getAllAsync<Person>(
      'SELECT * FROM Person WHERE id != ? AND motherId = ?',
      [personId, motherId]
    );
  }

  return result.map(p => transformPerson(p));
}

export async function getRootPersons(): Promise<Person[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Person>(
    'SELECT * FROM Person WHERE fatherId IS NULL AND motherId IS NULL'
  );
  return result.map(p => transformPerson(p));
}

export async function getFamilyTree(): Promise<FamilyTree> {
  const database = await initDatabase();
  const persons = await getAllPersons();
  const personMap = new Map<string, PersonWithRelations>();

  const allChildren: Record<string, Person[]> = {};
  const allSpouses: Record<string, Person[]> = {};
  const allFathers: Record<string, Person> = {};
  const allMothers: Record<string, Person> = {};
  const allSiblings: Record<string, Person[]> = {};

  const personIds = persons.map(p => p.id);
  const personDict = new Map(persons.map(p => [p.id, p]));

  for (const person of persons) {
    if (person.fatherId) {
      const father = personDict.get(person.fatherId);
      if (father) allFathers[person.id] = father;
    }
    if (person.motherId) {
      const mother = personDict.get(person.motherId);
      if (mother) allMothers[person.id] = mother;
    }
  }

  for (const person of persons) {
    const children = persons.filter(p => p.fatherId === person.id || p.motherId === person.id);
    allChildren[person.id] = children;
  }

  const marriages = await database.getAllAsync<{ person1Id: string; person2Id: string }>(
    'SELECT person1Id, person2Id FROM Marriage'
  );
  
  for (const m of marriages) {
    if (allSpouses[m.person1Id]) {
      const spouse = personDict.get(m.person2Id);
      if (spouse) allSpouses[m.person1Id].push(spouse);
    } else {
      const spouse = personDict.get(m.person2Id);
      if (spouse) allSpouses[m.person1Id] = [spouse];
    }
    if (allSpouses[m.person2Id]) {
      const spouse = personDict.get(m.person1Id);
      if (spouse) allSpouses[m.person2Id].push(spouse);
    } else {
      const spouse = personDict.get(m.person1Id);
      if (spouse) allSpouses[m.person2Id] = [spouse];
    }
  }

  for (const person of persons) {
    if (!person.fatherId && !person.motherId) {
      allSiblings[person.id] = [];
      continue;
    }
    const siblings = persons.filter(p => {
      if (p.id === person.id) return false;
      if (person.fatherId && p.fatherId === person.fatherId) return true;
      if (person.motherId && p.motherId === person.motherId) return true;
      return false;
    });
    allSiblings[person.id] = siblings;
  }

  for (const person of persons) {
    personMap.set(person.id, {
      ...person,
      father: allFathers[person.id],
      mother: allMothers[person.id],
      children: allChildren[person.id] || [],
      spouses: allSpouses[person.id] || [],
      siblings: allSiblings[person.id] || [],
    });
  }

  const rootIds = persons
    .filter(p => !p.fatherId && !p.motherId)
    .map(p => p.id);

  return { persons: personMap, rootIds };
}