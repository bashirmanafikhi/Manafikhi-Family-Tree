import { Person, PersonMeta } from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

let persons: Person[] = [];

function parseFrontmatter(text: string): { meta: Record<string, string>; content: string } {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: text };
  
  const meta: Record<string, string> = {};
  const lines = match[1].split('\n');
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      let value = valueParts.join(':').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      meta[key.trim()] = value;
    }
  });
  
  return { meta, content: match[2] };
}

export async function loadAllPersonsAsync(): Promise<Person[]> {
  // Use require.context to dynamically find all .md files in the people directory
  // The path is relative to this file: src/parsers/markdown.ts -> ../../assets/manafikhi-obsidian/people
  const context = (require as any).context('../../assets/manafikhi-obsidian/people', true, /\.md$/);
  
  const personFiles = context.keys().map((key: string) => {
    const parts = key.split('/');
    // key is like "./mohammad-abdo/طارق.md" or "./طارق.md" or "./sub/folder/file.md"
    const file = parts[parts.length - 1];
    const folderParts = parts.slice(1, -1);
    const folder = folderParts.join('/');
    return {
      folder,
      file,
      req: context(key)
    };
  });
  
  const allPersons: Person[] = [];
  
  for (const pf of personFiles) {
    try {
      const asset = Asset.fromModule(pf.req);
      await asset.downloadAsync();
      if (!asset.localUri) continue;
      
      const mdText = await FileSystem.readAsStringAsync(asset.localUri);
      const { meta, content } = parseFrontmatter(mdText);
      
      const fileNameNoExt = pf.file.replace('.md', '');
      const id = pf.folder ? `${pf.folder}/${fileNameNoExt}` : fileNameNoExt;
      const name = meta.name || fileNameNoExt;
      
      allPersons.push({
        id,
        folderName: pf.folder,
        fileName: pf.file,
        name,
        birthDate: meta.birth_date || '',
        gender: meta.gender as 'male' | 'female' || 'male',
        images: meta.images ? [meta.images] : [],
        bio: content.trim(),
        rawMeta: meta as PersonMeta,
      });
    } catch (e) {
      console.error(`Error loading ${pf.file}:`, e);
    }
  }
  
  persons = allPersons;
  return persons;
}

export function getPersonForId(id: string): Person | undefined {
  return persons.find(p => p.id === id);
}

export function loadAllPersons(): Person[] {
  return persons;
}

export function getImageUri(imagePath: string): string {
  return imagePath;
}