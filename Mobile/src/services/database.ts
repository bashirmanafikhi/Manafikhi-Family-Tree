import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Person, PersonWithRelations, FamilyTree } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

function transformPerson(raw: any): Person {
  return {
    ...raw,
    gender: (raw.gender === 'm' || raw.gender === 'MALE') ? 'MALE' : 'FEMALE',
    additionalImages: raw.additionalImages ? JSON.parse(raw.additionalImages as unknown as string) : [],
  };
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  const dbName = 'dev.db';
  const dbDir = `${FileSystem.documentDirectory}SQLite`;
  const dbPath = `${dbDir}/${dbName}`;

  const fileInfo = await FileSystem.getInfoAsync(dbPath);

  if (!fileInfo.exists) {
    console.log('Database not found in storage, copying from assets...');
    try {
      // Ensure SQLite directory exists
      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      // Load asset and copy
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
      console.error('Error copying database:', error);
      // Fallback: just try to open and see if it creates a new one
    }
  }

  // Use the default openDatabaseAsync but ensure it's pointing to our name
  db = await SQLite.openDatabaseAsync(dbName);
  return db;
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

export async function getRootPersons(): Promise<Person[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Person>(
    'SELECT * FROM Person WHERE fatherId IS NULL AND motherId IS NULL'
  );
  return result.map(p => transformPerson(p));
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