# Nickname Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add nickname (لقب) field to Person model, display in mobile and web detail pages, add to web edit/add forms

**Architecture:** Add nullable `nickname` field to database schema, update types in both apps, display in detail views and forms

**Tech Stack:** Prisma (SQLite), TypeScript, React Native (Mobile), Next.js (Web)

---

### Task 1: Add nickname field to Prisma schema

**Files:**
- Modify: `Web/prisma/schema.prisma:10-35`

- [ ] **Step 1: Add nickname field to Person model in schema**

Add `nickname String?` after `lastName` field:

```prisma
model Person {
  id                String   @id @default(cuid())
  firstName         String
  lastName          String?
  nickname         String?
  gender            String
  // ... rest of fields remain the same
}
```

- [ ] **Step 2: Run Prisma migration**

```bash
cd Web
npx prisma migrate dev --name add_nickname_field
```

Expected: Migration created and applied successfully

- [ ] **Step 3: Commit**

```bash
git add Web/prisma/schema.prisma
git commit -m "feat: add nickname field to Person model"
```

---

### Task 2: Add nickname to Mobile types

**Files:**
- Modify: `Mobile/src/types/index.ts:1-34`

- [ ] **Step 1: Add nickname to Person interface**

After `lastName?: string`, add:

```typescript
export interface Person {
  id: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  gender: 'MALE' | 'FEMALE';
  // ... rest unchanged
}
```

- [ ] **Step 2: Commit**

```bash
git add Mobile/src/types/index.ts
git commit -m "feat: add nickname to Mobile Person type"
```

---

### Task 3: Display nickname in Mobile detail page

**Files:**
- Modify: `Mobile/app/person/[id].tsx`

- [ ] **Step 1: Add nickname to view section**

After line 116-118 (name display), add nickname display:

```tsx
<Text className="text-2xl font-bold text-center" style={{ color: colors.text }}>
  {person.firstName} {person.lastName || ''}
</Text>

{/* Add this - nickname display */}
{person.nickname && (
  <Text className="text-lg mt-1 text-center" style={{ color: colors.textSecondary }}>
    ({person.nickname})
  </Text>
)}
```

- [ ] **Step 2: Commit**

```bash
git add Mobile/app/person/\[id\].tsx
git commit -m "feat: display nickname in Mobile person detail"
```

---

### Task 4: Display nickname in Web person detail page

**Files:**
- Modify: `Web/components/person/person-detail.tsx`

- [ ] **Step 1: Add nickname to interface props**

Update interface at line 10-28 to include nickname:

```typescript
interface PersonDetailProps {
  person: {
    id: string
    firstName: string
    lastName: string | null
    nickname: string | null  // ADD THIS
    gender: string
    // ... rest unchanged
  }
```

- [ ] **Step 2: Add nickname to view mode**

After name display in view mode (around line 271-273):

```tsx
<h1 className="text-3xl font-bold" style={{ color: '#2d2926' }}>
  {person.firstName} {person.lastName}
</h1>

{/* Add this - nickname */}
{person.nickname && (
  <p className="text-lg" style={{ color: '#6b6560' }}>
    ({person.nickname})
  </p>
)}
```

- [ ] **Step 3: Commit**

```bash
git add Web/components/person/person-detail.tsx
git commit -m "feat: display nickname in Web person detail"
```

---

### Task 5: Add nickname to Web edit form

**Files:**
- Modify: `Web/components/person/person-detail.tsx`

- [ ] **Step 1: Add nickname to form state**

In formData initialization (around line 35-44), add:

```typescript
const [formData, setFormData] = useState({
  firstName: person.firstName,
  lastName: person.lastName || '',
  nickname: person.nickname || '',  // ADD THIS
  gender: person.gender,
  // ... rest unchanged
})
```

- [ ] **Step 2: Add nickname to update data**

In handleSave function (around line 88-97), add:

```typescript
const updateData = {
  firstName: formData.firstName,
  lastName: formData.lastName || null,
  nickname: formData.nickname || null,  // ADD THIS
  gender: formData.gender,
  // ... rest unchanged
}
```

- [ ] **Step 3: Add nickname input field in edit form**

In edit form UI (around line 611-631), add after lastName field:

```tsx
<div>
  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>اللقب</label>
  <input
    type="text"
    value={formData.nickname}
    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
    className="input-field"
    placeholder="الشيخ"
  />
</div>
```

- [ ] **Step 4: Update formData reset in useEffect**

In useEffect at line 72-83, add nickname to setFormData:

```typescript
useEffect(() => {
  setFormData({
    firstName: person.firstName,
    lastName: person.lastName || '',
    nickname: person.nickname || '',  // ADD THIS
    gender: person.gender,
    // ... rest unchanged
  })
}, [person])
```

- [ ] **Step 5: Commit**

```bash
git add Web/components/person/person-detail.tsx
git commit -m "feat: add nickname field to Web edit form"
```

---

### Task 6: Add nickname to Web add form (PersonForm)

**Files:**
- Modify: `Web/components/forms/person-form.tsx`

- [ ] **Step 1: Add nickname to formData state**

In formData initialization (around line 27-36), add:

```typescript
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  nickname: '',  // ADD THIS
  gender: 'MALE' as 'MALE' | 'FEMALE',
  fatherId: prefillFather || undefined,
  motherId: prefillMother || undefined,
  isAlive: true,
  birthDate: '',
  deathDate: '',
})
```

- [ ] **Step 2: Add nickname to form submission**

No changes needed - formData is already sent as JSON to API

- [ ] **Step 3: Add nickname input field**

After lastName field (around line 130-140), add:

```tsx
<div>
  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>اللقب</label>
  <input
    type="text"
    value={formData.nickname || ''}
    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
    className="input-field"
    placeholder="الشيخ"
  />
</div>
```

- [ ] **Step 4: Commit**

```bash
git add Web/components/forms/person-form.tsx
git commit -m "feat: add nickname field to Web add person form"
```

---

## Execution Options

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** - Dispatch subagents per task, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans

Which approach?