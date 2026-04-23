# Family Tree Application Design

## Project Overview

**Project Name:** Manafikhi Family Tree
**Type:** Web Application (Next.js)
**Purpose:** Manage and visualize a large family tree (~5000 persons, 10 generations) with complex relationships (cousin marriage, polygamy, different surnames)
**Target User:** Developer building for personal data collection

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Database | SQLite |
| ORM | Prisma |
| UI | Tailwind CSS + shadcn/ui |
| Tree Viz | React Flow |
| State | React hooks / Zustand |

---

## Data Model

### Prisma Schema

```prisma
model Person {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String?  // Flexible: defaults from father, editable for special cases
  gender      Gender
  birthDate   DateTime?
  deathDate   DateTime?
  isAlive     Boolean  @default(true)
  profileImage String?
  additionalImages Json?  // Array of image URLs
  bio         String?  @db.Text // Markdown details
  
  fatherId    String?
  motherId    String?
  father      Person?  @relation("FatherChild", fields: [fatherId], references: [id])
  mother      Person?  @relation("MotherChild", fields: [motherId], references: [id])
  childrenOfFather Person[] @relation("FatherChild")
  childrenOfMother Person[] @relation("MotherChild")

  marriagesAsPerson1 Marriage[] @relation("Person1Marriages")
  marriagesAsPerson2 Marriage[] @relation("Person2Marriages")

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum Gender {
  MALE
  FEMALE
}

model Marriage {
  id          String   @id @default(cuid())
  person1Id   String   // First spouse
  person2Id   String   // Second spouse
  person1     Person   @relation("Person1Marriages", fields: [person1Id], references: [id])
  person2     Person   @relation("Person2Marriages", fields: [person2Id], references: [id])
  
  startDate   DateTime? // When marriage started
  endDate     DateTime? // When marriage ended (divorce or death)
  isCurrent   Boolean  @default(true) // Still ongoing?
  notes       String?  @db.Text // Additional marriage details (markdown)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([person1Id, person2Id])
}
```

### Design Rationale

- **Self-relations**: `fatherId` and `motherId` are optional - allows flexible linking
- **Marriage table**: Track spouses with optional dates and notes. Enables polygamy and cousin marriage tracking
- **lastName optional**: Default auto-fill from father, but can override
- **All optional fields**: Except firstName and gender - enables fast entry

---

## Features

### 1. Person List View (Priority: High)

- **Table display** with columns: Name, Gender, Birth Year, Death Year, Father, Mother, Alive Status
- **Search**: Filter by name (first or last)
- **Sort**: By name, birth date, creation date
- **Filters**: Gender (M/F), Alive/Deceased
- **Pagination**: 50-100 persons per page

### 2. Quick Add Form (Priority: High)

- **Minimal fields**:
  - First Name (required)
  - Last Name (optional, auto-filled from father)
  - Gender (required - M/F dropdown or toggle)
  - Father (searchable dropdown)
  - Mother (searchable dropdown)
- **Searchable dropdowns**: Display format = "FirstName FatherLastName (MotherFirstName) - LastName"
  - Example: "Ahmed Ibrahim (Fatima) Al-Manafikhi"
  - This helps avoid duplicates when many persons share the same first name
- **Action buttons**:
  - "Save & Add Child" → Creates person, pre-fills as parent for new entry
  - "Save & Add Sibling" → Creates person, redirects to form with same parents pre-filled
  - "Save & Add Spouse" → Creates person, shows dialog to add spouse (creates Marriage record)
  - "Save & Continue" → Creates person, clears form
- **No validation**: No required fields enforcement (flexible entry)

### 2b. Add Child Quick Action (Priority: High)

- **"Add Child" button** on any person's detail page
- **Auto-fill**: Opens quick-add form with current person pre-filled as Father OR Mother
- **User selects**: Toggle which parent (father/mother) to auto-fill
- **Workflow**: Click "Add Child" → Form opens with parent pre-filled → Fill child name → Save

### 3. Person Detail Page (Priority: High)

- **View mode**: Display all fields
- **Edit mode**: All fields editable
- **Sections**:
  - **Basic**: First name, Last name, Gender
  - **Dates**: Birth date, Death date, Is Alive toggle
  - **Images**: Profile image URL, Additional images (JSON array)
  - **Bio**: Markdown textarea
  - **Parents**: Link/Unlink father/mother (searchable)
  - **Children**: List of children (read-only, click to navigate) with "Add Child" quick button
  - **Spouses**: List of marriages with dates and status (current/ended)
    - Each spouse shows: Name, marriage dates, isCurrent status
    - "Add Spouse" button to create new Marriage record
    - Click spouse to navigate to their detail page
- **Delete**: Soft delete or hard delete option

### 4. Tree Visualization (Priority: Medium)

- **React Flow** based
- **Layout**: Top-down family tree (ancestors at top)
- **Nodes**: Person cards showing name + basic info
- **Edges**: Lines connecting parent → child
- **Interactions**:
  - Pan/Zoom
  - Click node to view details
  - Drag to reposition (optional save)

### 5. Search & Link (Priority: Medium)

- **Global search**: Find any person by name
- **Quick link**: When adding parent, search existing persons
- **Avoid duplicates**: Warn if similar name exists

---

## User Experience

### Quick Add Workflow

```
1. User visits /persons/new (or clicks "Add Person")
2. Enters: First Name + Gender + optional father/mother search
3. Clicks "Save & Add Child"
4. System creates person
5. Redirects to new entry with father/mother pre-filled
```

### Tree View Workflow

```
1. User visits /tree
2. System fetches all persons and builds tree
3. React Flow renders top-down layout
4. User clicks node → opens detail sidebar
5. User can pan/zoom to explore
```

---

## Non-Functional Requirements

- **Performance**: Handle 5000 persons without major lag
- **Data integrity**: Prisma handles relations, no cascade delete (manual)
- **Future**: Easy to migrate to PostgreSQL (just change provider in schema)

---

## Phased Implementation

### Phase 1: Core Data (List + Quick Add)
1. Prisma schema + SQLite setup
2. Basic CRUD API routes
3. Person list view with search/filter
4. Quick add form

### Phase 2: Detail Pages
5. Person detail/edit page
6. Parent linking UI

### Phase 3: Visualization
7. React Flow tree view
8. Node click → detail sidebar

### Phase 4: Enhancements (Optional)
9. Additional images
10. Markdown editor for bio
11. Export/Import data

---

## Acceptance Criteria

- [ ] Can create person with only firstName + gender (no other required fields)
- [ ] Can link father and/or mother to person
- [ ] Can have multiple partners (via Marriage table)
- [ ] Can view/edit marriage details (dates, isCurrent, notes)
- [ ] Can edit lastName independently (different from father's)
- [ ] List view shows all persons with search/filter
- [ ] Searchable dropdowns show "FirstName FatherLastName (MotherFirstName) - LastName"
- [ ] "Save & Add Sibling" button creates sibling with same parents pre-filled
- [ ] "Add Child" quick action on person page auto-fills parent
- [ ] Tree view shows visual family graph
- [ ] Data persists in SQLite database

---

## File Structure (Proposed)

```
/app
  /api/persons/route.ts       # CRUD endpoints
  /persons/page.tsx          # List view
  /persons/new/page.tsx       # Quick add form
  /persons/[id]/page.tsx     # Detail view/edit
  /tree/page.tsx             # React Flow tree
/components
  /PersonForm.tsx
  /PersonCard.tsx
  /FamilyTree.tsx
/lib
  /prisma.ts               # Prisma client
/prisma/schema.prisma     # Database schema
```