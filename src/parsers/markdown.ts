import { Person, PersonMeta } from '../types';

const persons: Person[] = [
  { id: 'mohammad-abdo/محمود', folderName: 'mohammad-abdo', fileName: 'محمود.md', name: 'محمود', birthDate: '1940', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/حسن', folderName: 'mohammad-abdo', fileName: 'حسن.md', name: 'حسن', birthDate: '1812', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/محمود-ديب', folderName: 'mohammad-abdo', fileName: 'محمد-ديب.md', name: 'محمد ديب', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/بكري', folderName: 'mohammad-abdo', fileName: 'بكري.md', name: 'بكري', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/شريف', folderName: 'mohammad-abdo', fileName: 'شريف.md', name: 'شريف', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/محمود-حسن', folderName: 'mohammad-abdo', fileName: 'محمود-حسن.md', name: 'محمود', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/طارق', folderName: 'mohammad-abdo', fileName: 'طارق.md', name: 'طارق', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/احمد', folderName: 'mohammad-abdo', fileName: 'احمد.md', name: 'أحمد', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/عبد-الرحمن', folderName: 'mohammad-abdo', fileName: 'عبد-الرحمن.md', name: 'عبد الرحمن', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
  { id: 'mohammad-abdo/محمود-عبدو', folderName: 'mohammad-abdo', fileName: 'محمود-عبدو.md', name: 'محمد عبدو', birthDate: '1920', gender: 'male', images: [], bio: '', rawMeta: {} as PersonMeta },
];

export function loadAllPersons(): Person[] {
  return persons;
}

export function getImageUri(imagePath: string): string {
  return imagePath;
}