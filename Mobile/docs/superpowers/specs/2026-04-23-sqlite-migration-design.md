# SQLite Migration Design - Family Tree App

**Date:** 2026-04-23  
**Status:** Approved

## Overview

Refactor the Manafikhi Family Tree mobile application to read all data from SQLite database (`assets/dev.db`) instead of Obsidian canvas and markdown files. The app will display a family tree hierarchy and person details page.

## Database Schema

### Person Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| firstName | TEXT NOT NULL | First name (Arabic) |
| lastName | TEXT | Last name / family name |
| gender | TEXT NOT NULL | 'm' or 'f' |
| birthDate | DATETIME | Birth date |
| deathDate | DATETIME | Death date |
| isAlive | BOOLEAN DEFAULT true | Living status |
| profileImage | TEXT | Profile image URL |
| additionalImages | TEXT DEFAULT '[]' | JSON array of image URLs |
| bio | TEXT | Biography text |
| fatherId | TEXT REFERENCES Person(id) | Father's ID |
| motherId | TEXT REFERENCES Person(id) | Mother's ID |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Update timestamp |

### Marriage Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| person1Id | TEXT REFERENCES Person(id) | First spouse |
| person2Id | TEXT REFERENCES Person(id) | Second spouse |
| startDate | DATETIME | Marriage date |
| endDate | DATETIME | End date (divorce/death) |
| isCurrent | BOOLEAN DEFAULT true | Active marriage |
| notes | TEXT | Notes |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Update timestamp |

## Architecture

```
src/
├── types/
│   └── index.ts          # Updated Person and FamilyTree types
├── services/
│   └── database.ts      # SQLite service with queries
├── context/
│   └── FamilyContext.tsx # Refactored to load from SQLite
app/
├── index.tsx            # Tree visualization (refactored)
├── person/[id].tsx    # Person details (enhanced)
│
assets/
└── dev.db             # SQLite database (existing)
```

## TypeScript Types

### Person Entity (src/types/index.ts)
```typescript
export interface Person {
  id: string;
  firstName: string;
  lastName?: string;
  fullName: string;           // computed: firstName + lastName
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
  spouse?: Person;           // current spouse from Marriage table
  spouses: Person[];        // all spouses
}

export interface FamilyTree {
  persons: Map<string, PersonWithRelations>;
  rootIds: string[];        // persons without parents
}
```

## Database Service (src/services/database.ts)

### Functions
- `initDatabase()` - Initialize database connection
- `getAllPersons()` - Load all persons
- `getPersonById(id)` - Single person with relations
- `getChildren(parentId)` - Get children via fatherId/motherId
- `getParents(personId)` - Get father and mother
- `getSpouses(personId)` - Get spouses from Marriage table
- `getRootPersons()` - Persons without fatherId/motherId

## Family Context

### State
- `persons: PersonWithRelations[]` - All persons with relations
- `isLoading: boolean`
- `error: string | null`

### Methods
- `getPersonById(id)` - Get person with relations
- `getChildren(personId)` - Get children
- `getParents(personId)` - Get parents
- `getSpouses(personId)` - Get spouses

## UI Changes

### Tree Screen (app/index.tsx)
- Build tree from fatherId/motherId (no more canvas edges)
- Root nodes = persons where both fatherId and motherId are null
- Children = persons with matching fatherId or motherId
- Spouses shown next to person (from Marriage table)
- Search filters by name

### Person Details Screen (app/person/[id].tsx)
Enhance to show:
- **Header**: Name, gender emoji (👨/👩)
- **Status**: isAlive indicator or death date
- **Dates**: Birth date, death date (if applicable)
- **Parents**: Father and Mother with links
- **Children**: List with links
- **Spouses**: Current and past spouses
- **Images**: Gallery with swipe (profile + additional)
- **Bio**: Full biography

## Implementation Steps

1. Install `expo-sqlite` package
2. Update TypeScript types
3. Create database service with queries
4. Refactor FamilyContext to load from SQLite
5. Refactor tree screen to use fatherId/motherId
6. Enhance person details screen
7. Test and verify

## Notes

- Keep obsidian folder for backup (not deleted)
- No canvas file reading anymore
- No markdown file reading anymore
- Tree hierarchy derived from fatherId/motherId relationships