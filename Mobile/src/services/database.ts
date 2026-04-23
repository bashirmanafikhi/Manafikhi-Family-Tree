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

      // In dev mode, we might want to force copy if the file is newer, 
      // but for now let's stick to only if it doesn't exist to be safe.
      if (!fileInfo.exists) {
        console.log('Database not found in storage, copying from assets...');
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