# Family Tree Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js family tree application with Prisma + SQLite to manage ~5000 persons with complex relationships (cousin marriage, polygamy, different surnames)

**Architecture:** Next.js 14 App Router with Prisma ORM and SQLite database. Features: person list view, quick-add form, person detail page with marriage management, React Flow tree visualization.

**Tech Stack:** Next.js 14, Prisma, SQLite, Tailwind CSS, shadcn/ui, React Flow, Zustand

---

## File Structure

```
/app
  /api/persons/route.ts           # GET all, POST create
  /api/persons/[id]/route.ts     # GET, PUT, DELETE single
  /api/persons/search/route.ts   # Search API
  /api/marriages/route.ts        # GET, POST marriage
  /api/marriages/[id]/route.ts   # PUT, DELETE marriage
  /persons/page.tsx              # List view
  /persons/new/page.tsx           # Quick add form
  /persons/[id]/page.tsx        # Detail view/edit
  /tree/page.tsx                 # Tree visualization
/components
  /forms/person-form.tsx          # Quick add/edit form
  /ui/person-dropdown.tsx       # Searchable person dropdown
  /tree/family-tree.tsx         # React Flow tree
  /ui/data-table.tsx            # Table with sorting/filtering
/lib
  /prisma.ts                   # Prisma client singleton
  /db.ts                       # Database utilities
/prisma/schema.prisma          # Database schema
  /seed.ts                     # Seed script (optional)
/styles
  /globals.css                # Tailwind + custom styles
```

---

## Task 1: Project Setup

**Files:**
- Modify: `package.json` (create)
- Modify: `next.config.ts` (create)
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "manafikhi-family-tree",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.10.0",
    "zod": "^3.22.0",
    "lucide-react": "^0.344.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "reactflow": "^11.10.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "prisma": "^5.10.0",
    "tsx": "^4.7.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

- [ ] **Step 5: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Create postcss.config.mjs**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Create app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Family Tree',
  description: 'Manafikhi Family Tree Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Create app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.2%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 9: Commit**

```bash
git init
git add package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs app/globals.css app/layout.tsx
git commit -m "feat: scaffold Next.js project with Tailwind"
```

---

## Task 2: Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `lib/utils.ts`

- [ ] **Step 1: Create prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Person {
  id                String   @id @default(cuid())
  firstName         String
  lastName          String?
  gender            Gender
  birthDate         DateTime?
  deathDate         DateTime?
  isAlive          Boolean  @default(true)
  profileImage     String?
  additionalImages String?  @default("[]")
  bio              String?
  
  fatherId         String?
  motherId         String?
  father           Person?  @relation("FatherChild", fields: [fatherId], references: [id])
  mother           Person?  @relation("MotherChild", fields: [motherId], references: [id])
  childrenOfFather Person[] @relation("FatherChild")
  childrenOfMother Person[] @relation("MotherChild")

  marriagesAsPerson1 Marriage[] @relation("Person1Marriages")
  marriagesAsPerson2 Marriage[] @relation("Person2Marriages")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Gender {
  MALE
  FEMALE
}

model Marriage {
  id         String   @id @default(cuid())
  person1Id String
  person2Id String
  person1   Person   @relation("Person1Marriages", fields: [person1Id], references: [id])
  person2   Person   @relation("Person2Marriages", fields: [person2Id], references: [id])

  startDate DateTime?
  endDate  DateTime?
  isCurrent Boolean  @default(true)
  notes    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([person1Id, person2Id])
}
```

- [ ] **Step 2: Create lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 3: Create lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPersonDisplayName(person: {
  firstName: string
  lastName: string | null
  father?: { firstName: string; lastName: string | null } | null
  mother?: { firstName: string } | null
}): string {
  const parts = [person.firstName]
  
  if (person.father?.lastName) {
    parts.push(person.father.lastName)
  }
  
  if (person.mother?.firstName) {
    parts.push(`(${person.mother.firstName})`)
  }
  
  if (person.lastName && person.lastName !== person.father?.lastName) {
    parts.push(`- ${person.lastName}`)
  }
  
  return parts.join(' ')
}
```

- [ ] **Step 4: Generate Prisma client**

Run: `npx prisma generate`

- [ ] **Step 5: Push schema to database**

Run: `npx prisma db push`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma lib/prisma.ts lib/utils.ts
git commit -m "feat: add Prisma schema with Person and Marriage models"
```

---

## Task 3: Person API Routes

**Files:**
- Create: `app/api/persons/route.ts`
- Create: `app/api/persons/[id]/route.ts`
- Create: `app/api/persons/search/route.ts`

- [ ] **Step 1: Create app/api/persons/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPersonSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  isAlive: z.boolean().optional(),
  profileImage: z.string().optional(),
  additionalImages: z.string().optional(),
  bio: z.string().optional(),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const gender = searchParams.get('gender')
  const isAlive = searchParams.get('isAlive')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
  }
  
  if (gender) {
    where.gender = gender
  }
  
  if (isAlive !== null && isAlive !== undefined) {
    where.isAlive = isAlive === 'true'
  }

  const [persons, total] = await Promise.all([
    prisma.person.findMany({
      where,
      include: {
        father: { select: { id: true, firstName: true, lastName: true } },
        mother: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { firstName: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.person.count({ where }),
  ])

  return NextResponse.json({
    data: persons,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const data = createPersonSchema.parse(body)

  const person = await prisma.person.create({
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
    },
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(person, { status: 201 })
}
```

- [ ] **Step 2: Create app/api/persons/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePersonSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  isAlive: z.boolean().optional(),
  profileImage: z.string().optional(),
  additionalImages: z.string().optional(),
  bio: z.string().optional(),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
      childrenOfFather: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      childrenOfMother: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      marriagesAsPerson1: {
        include: {
          person2: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      marriagesAsPerson2: {
        include: {
          person1: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  })

  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 })
  }

  return NextResponse.json(person)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const data = updatePersonSchema.parse(body)

  const updateData: any = { ...data }
  if (data.birthDate) updateData.birthDate = new Date(data.birthDate)
  if (data.deathDate) updateData.deathDate = new Date(data.deathDate)

  const person = await prisma.person.update({
    where: { id: params.id },
    data: updateData,
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(person)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.person.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Create app/api/persons/search/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!query || query.length < 1) {
    return NextResponse.json([])
  }

  const persons = await prisma.person.findMany({
    where: {
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      father: {
        select: { firstName: true, lastName: true },
      },
      mother: {
        select: { firstName: true },
      },
    },
    take: limit,
  })

  const formatted = persons.map((p) => ({
    id: p.id,
    label: [
      p.firstName,
      p.father?.lastName,
      p.mother?.firstName ? `(${p.mother.firstName})` : null,
      p.lastName && p.lastName !== p.father?.lastName ? `- ${p.lastName}` : null,
    ]
      .filter(Boolean)
      .join(' '),
    firstName: p.firstName,
    lastName: p.lastName,
    gender: p.gender,
  }))

  return NextResponse.json(formatted)
}
```

- [ ] **Step 4: Create Marriage API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMarriageSchema = z.object({
  person1Id: z.string(),
  person2Id: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const personId = searchParams.get('personId')

  if (!personId) {
    return NextResponse.json({ error: 'personId required' }, { status: 400 })
  }

  const marriages = await prisma.marriage.findMany({
    where: {
      OR: [{ person1Id: personId }, { person2Id: personId }],
    },
    include: {
      person1: { select: { id: true, firstName: true, lastName: true, gender: true } },
      person2: { select: { id: true, firstName: true, lastName: true, gender: true } },
    },
  })

  return NextResponse.json(marriages)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const data = createMarriageSchema.parse(body)

  const marriage = await prisma.marriage.create({
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
    include: {
      person1: { select: { id: true, firstName: true, lastName: true } },
      person2: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(marriage, { status: 201 })
}
```

- [ ] **Step 5: Test API endpoints**

Run: `curl -X GET http://localhost:3000/api/persons`
Expected: JSON response with empty array

- [ ] **Step 6: Commit**

```bash
git add app/api/persons app/api/marriages
git commit -m "feat: add Person and Marriage API routes"
```

---

## Task 4: Person List View

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/person/person-table.tsx`
- Create: `app/persons/page.tsx`

- [ ] **Step 1: Create UI components**

Create shadcn/ui style components in `/components/ui/`:
- `button.tsx` - BaseButton component
- `input.tsx` - Input component
- `label.tsx` - Label component
- `select.tsx` - Select component (using @radix-ui/react-select)
- `card.tsx` - Card components

- [ ] **Step 2: Create PersonTable component**

```typescript
'use client'

import Link from 'next/link'
import { Person } from '@prisma/client'

interface PersonWithRelations extends Person {
  father?: { firstName: string; lastName: string | null } | null
  mother?: { firstName: string; lastName: string | null } | null
}

interface PersonTableProps {
  persons: PersonWithRelations[]
}

export function PersonTable({ persons }: PersonTableProps) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-right">الاسم</th>
            <th className="p-2 text-right">الجنس</th>
            <th className="p-2 text-right">تاريخ الميلاد</th>
            <th className="p-2 text-right">الحي</th>
            <th className="p-2 text-right">الأب</th>
            <th className="p-2 text-right">الأم</th>
          </tr>
        </thead>
        <tbody>
          {persons.map((person) => (
            <tr key={person.id} className="border-t hover:bg-muted/50">
              <td className="p-2">
                <Link href={`/persons/${person.id}`} className="text-blue-600 hover:underline">
                  {person.firstName} {person.lastName}
                </Link>
              </td>
              <td className="p-2">{person.gender === 'MALE' ? 'ذكر' : 'أنثى'}</td>
              <td className="p-2">
                {person.birthDate ? new Date(person.birthDate).getFullYear() : '-'}
              </td>
              <td className="p-2">{person.isAlive ? '✓' : '✗'}</td>
              <td className="p-2">
                {person.father ? `${person.father.firstName} ${person.father.lastName || ''}` : '-'}
              </td>
              <td className="p-2">
                {person.mother ? `${person.mother.firstName} ${person.mother.lastName || ''}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create app/persons/page.tsx**

```typescript
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { PersonTable } from '@/components/person/person-table'
import { PersonFilters } from '@/components/person/person-filters'
import Link from 'next/link'

async function getPersons(search: string, gender?: string, isAlive?: boolean) {
  const where: any = {}
  
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
  }
  
  if (gender) where.gender = gender
  if (isAlive !== undefined) where.isAlive = isAlive

  return prisma.person.findMany({
    where,
    include: {
      father: { select: { firstName: true, lastName: true } },
      mother: { select: { firstName: true, lastName: true } },
    },
    orderBy: { firstName: 'asc' },
    take: 100,
  })
}

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: { search?: string; gender?: string; alive?: string }
}) {
  const search = searchParams.search || ''
  const gender = searchParams.gender || undefined
  const isAlive = searchParams.alive === 'true' ? true : searchParams.alive === 'false' ? false : undefined

  const persons = await getPersons(search, gender, isAlive)

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">شجرة العائلة</h1>
        <Link href="/persons/new" className="btn btn-primary">
          إضافة شخص جديد
        </Link>
      </div>

      <PersonFilters />

      <Suspense fallback={<div>Loading...</div>}>
        <PersonTable persons={persons} />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 4: Create PersonFilters component**

```typescript
'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function PersonFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) params.set('search', term)
    else params.delete('search')
    replace(`${pathname}?${params.toString()}`)
  }, 300)

  return (
    <div className="flex gap-4 mb-4">
      <input
        type="text"
        placeholder="بحث بالاسم..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('search')?.toString()}
        className="input input-bordered"
      />
      
      <select
        onChange={(e) => {
          const params = new URLSearchParams(searchParams)
          if (e.target.value) params.set('gender', e.target.value)
          else params.delete('gender')
          replace(`${pathname}?${params.toString()}`)
        }}
        defaultValue={searchParams.get('gender')?.toString() || ''}
        className="select select-bordered"
      >
        <option value="">كل обе الجنسين</option>
        <option value="MALE">ذكر</option>
        <option value="FEMALE">أنثى</option>
      </select>

      <select
        onChange={(e) => {
          const params = new URLSearchParams(searchParams)
          if (e.target.value) params.set('alive', e.target.value)
          else params.delete('alive')
          replace(`${pathname}?${params.toString()}`)
        }}
        defaultValue={searchParams.get('alive')?.toString() || ''}
        className="select select-bordered"
      >
        <option value="">الكل</option>
        <option value="true">أحياء</option>
        <option value="false">متوفين</option>
      </select>
    </div>
  )
}
```

- [ ] **Step 5: Test the page**

Run: `npm run dev`
Navigate to: http://localhost:3000/persons

- [ ] **Step 6: Commit**

```bash
git add components/ui components/person app/persons
git commit -m "feat: add person list view with search and filters"
```

---

## Task 5: Quick Add Form

**Files:**
- Create: `components/forms/person-form.tsx`
- Create: `components/person/person-dropdown.tsx`
- Create: `app/persons/new/page.tsx`
- Create: `app/persons/[id]/page.tsx`

- [ ] **Step 1: Create PersonDropdown component**

```typescript
'use client'

import { useState, useEffect } from 'react'

interface PersonOption {
  id: string
  label: string
  firstName: string
  lastName?: string
  gender: 'MALE' | 'FEMALE'
}

interface PersonDropdownProps {
  value?: string
  onChange: (value: string | undefined) => void
  excludeIds?: string[]
  gender?: 'MALE' | 'FEMALE'
  placeholder: string
}

export function PersonDropdown({
  value,
  onChange,
  excludeIds = [],
  gender,
  placeholder,
}: PersonDropdownProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<PersonOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')

  useEffect(() => {
    if (query.length < 1) {
      setOptions([])
      return
    }

    const fetchPersons = async () => {
      const params = new URLSearchParams({ q: query, limit: '10' })
      const res = await fetch(`/api/persons/search?${params}`)
      const data = await res.json()
      setOptions(data.filter((p: PersonOption) => !excludeIds.includes(p.id)))
    }

    const timeout = setTimeout(fetchPersons, 200)
    return () => clearTimeout(timeout)
  }, [query, excludeIds])

  useEffect(() => {
    if (value) {
      const selected = options.find((o) => o.id === value)
      setSelectedLabel(selected?.label || '')
    }
  }, [value, options])

  const handleSelect = (option: PersonOption) => {
    onChange(option.id)
    setSelectedLabel(option.label)
    setQuery(option.label)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!value) setSelectedLabel('')
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="input input-bordered w-full"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange(undefined)
            setQuery('')
            setSelectedLabel('')
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-sm"
        >
          ✕
        </button>
      )}
      {isOpen && options.length > 0 && (
        <ul className="absolute z-10 w-full border rounded-md bg-white max-h-60 overflow-auto">
          {options.map((option) => (
            <li
              key={option.id}
              onClick={() => handleSelect(option)}
              className="p-2 hover:bg-muted cursor-pointer"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create PersonForm component**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PersonDropdown } from '@/components/person/person-dropdown'

interface PersonFormProps {
  initialData?: {
    firstName?: string
    lastName?: string
    gender?: 'MALE' | 'FEMALE'
    fatherId?: string
    motherId?: string
    isAlive?: boolean
    birthDate?: string
    deathDate?: string
  }
  prefillFather?: string
  prefillMother?: string
}

export function PersonForm({
  initialData,
  prefillFather,
  prefillMother,
}: PersonFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    gender: initialData?.gender || ('MALE' as 'MALE' | 'FEMALE'),
    fatherId: initialData?.fatherId || prefillFather || undefined,
    motherId: initialData?.motherId || prefillMother || undefined,
    isAlive: initialData?.isAlive ?? true,
    birthDate: initialData?.birthDate || '',
    deathDate: initialData?.deathDate || '',
  })

  const handleSubmit = async (action: 'continue' | 'addChild' | 'addSibling') => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to create')

      const person = await res.json()

      if (action === 'continue') {
        router.push('/persons')
      } else if (action === 'addChild') {
        router.push(`/persons/new?fatherId=${person.id}`)
      } else if (action === 'addSibling') {
        router.push(
          `/persons/new?fatherId=${formData.fatherId}&motherId=${formData.motherId}`
        )
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit('continue')
      }}
      className="space-y-4"
    >
      <div>
        <label className="label">الاسم الأول</label>
        <input
          type="text"
          required
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className="input input-bordered w-full"
        />
      </div>

      <div>
        <label className="label">الاسم الأخير</label>
        <input
          type="text"
          value={formData.lastName || ''}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          className="input input-bordered w-full"
        />
      </div>

      <div>
        <label className="label">الجنس</label>
        <select
          value={formData.gender}
          onChange={(e) =>
            setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })
          }
          className="select select-bordered w-full"
        >
          <option value="MALE">ذكر</option>
          <option value="FEMALE">أنثى</option>
        </select>
      </div>

      <div>
        <label className="label">الأب</label>
        <PersonDropdown
          value={formData.fatherId}
          onChange={(val) => setFormData({ ...formData, fatherId: val })}
          excludeIds={[]}
          gender="MALE"
          placeholder="اختر الأب..."
        />
      </div>

      <div>
        <label className="label">الأم</label>
        <PersonDropdown
          value={formData.motherId}
          onChange={(val) => setFormData({ ...formData, motherId: val })}
          excludeIds={[]}
          gender="FEMALE"
          placeholder="اختر الأم..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isAlive}
          onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked })}
          className="checkbox"
        />
        <label>حي</label>
      </div>

      <div>
        <label className="label">تاريخ الميلاد</label>
        <input
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
          className="input input-bordered"
        />
      </div>

      {!formData.isAlive && (
        <div>
          <label className="label">تاريخ الوفاة</label>
          <input
            type="date"
            value={formData.deathDate}
            onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
            className="input input-bordered"
          />
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'جاري...' : 'حفظ'}
        </button>
        
        <button
          type="button"
          onClick={() => handleSubmit('addChild')}
          disabled={isSubmitting}
          className="btn btn-secondary"
        >
          حفظ وإضافة طفل
        </button>
        
        <button
          type="button"
          onClick={() => handleSubmit('addSibling')}
          disabled={isSubmitting}
          className="btn btn-outline"
        >
          حفظ وإضافة أخ
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create app/persons/new/page.tsx**

```typescript
import { Suspense } from 'react'
import { PersonForm } from '@/components/forms/person-form'

export default function NewPersonPage({
  searchParams,
}: {
  searchParams: { fatherId?: string; motherId?: string }
}) {
  const fatherId = searchParams.fatherId
  const motherId = searchParams.motherId

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">إضافة شخص جديد</h1>
      
      <Suspense fallback={<div>Loading...</div>}>
        <PersonForm
          prefillFather={fatherId}
          prefillMother={motherId}
        />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 4: Test quick add form**

Navigate to: http://localhost:3000/persons/new

- [ ] **Step 5: Commit**

```bash
git add components/forms components/person app/persons/new
git commit -m "feat: add quick add form with Save & Add Child/Sibling buttons"
```

---

## Task 6: Person Detail Page

**Files:**
- Modify: `app/persons/[id]/page.tsx`
- Create: `components/person/person-detail.tsx`

- [ ] **Step 1: Create PersonDetail component**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PersonDetailProps {
  person: any
}

export function PersonDetail({ person }: PersonDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(person)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setFormData(person)
  }, [person])

  const handleSave = async () => {
    const res = await fetch(`/api/persons/${person.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      setIsEditing(false)
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الشخص؟')) return
    
    setIsDeleting(true)
    await fetch(`/api/persons/${person.id}`, { method: 'DELETE' })
    router.push('/persons')
  }

  const children = [
    ...(person.childrenOfFather || []),
    ...(person.childrenOfMother || []),
  ]
  const uniqueChildren = Array.from(new Map(children.map(c => [c.id, c])).map(([_, v]) => v)

  const spouses = [
    ...(person.marriagesAsPerson1 || []).map(m => ({
      ...m.person2,
      marriage: m
    })),
    ...(person.marriagesAsPerson2 || []).map(m => ({
      ...m.person1,
      marriage: m
    })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {person.firstName} {person.lastName}
          </h1>
          <p className="text-muted-foreground">
            {person.gender === 'MALE' ? 'ذكر' : 'أنثى'}
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="btn btn-primary">حفظ</button>
              <button onClick={() => setIsEditing(false)} className="btn">إلغاء</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="btn btn-primary">تعديل</button>
              <button onClick={handleDelete} className="btn btn-error" disabled={isDeleting}>
                {isDeleting ? 'جاري...' : 'حذف'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">المعلومات الأساسية</h2>
          
          <div>
            <label className="text-sm text-muted-foreground">الاسم الأول</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="input input-bordered w-full"
              />
            ) : (
              <p>{person.firstName}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">الاسم الأخير</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="input input-bordered w-full"
              />
            ) : (
              <p>{person.lastName || '-'}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">تاريخ الميلاد</label>
            {isEditing ? (
              <input
                type="date"
                value={formData.birthDate?.split('T')[0] || ''}
                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                className="input input-bordered"
              />
            ) : (
              <p>{person.birthDate ? new Date(person.birthDate).toLocaleDateString('ar') : '-'}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">alive status</label>
            {isEditing ? (
              <input
                type="checkbox"
                checked={formData.isAlive}
                onChange={e => setFormData({ ...formData, isAlive: e.target.checked })}
              />
            ) : (
              <p>{person.isAlive ? 'حي' : 'متوفى'}</p>
            )}
          </div>
          
          {!formData.isAlive && (
            <div>
              <label className="text-sm text-muted-foreground">تاريخ الوفاة</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.deathDate?.split('T')[0] || ''}
                  onChange={e => setFormData({ ...formData, deathDate: e.target.value })}
                  className="input input-bordered"
                />
              ) : (
                <p>{person.deathDate ? new Date(person.deathDate).toLocaleDateString('ar') : '-'}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">الوالدين</h2>
          
          <div>
            <label className="text-sm text-muted-foreground">الأب</label>
            {person.father ? (
              <Link href={`/persons/${person.father.id}`} className="text-blue-600 hover:underline">
                {person.father.firstName} {person.father.lastName}
              </Link>
            ) : (
              <p>-</p>
            )}
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">الأم</label>
            {person.mother ? (
              <Link href={`/persons/${person.mother.id}`} className="text-blue-600 hover:underline">
                {person.mother.firstName} {person.mother.lastName}
              </Link>
            ) : (
              <p>-</p>
            )}
          </div>
          
          <Link href={`/persons/new?fatherId=${person.id}`} className="btn btn-outline btn-sm">
            + إضافة طفل
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">الأبناء ({uniqueChildren.length})</h2>
        {uniqueChildren.length > 0 ? (
          <ul className="space-y-2">
            {uniqueChildren.map((child: any) => (
              <li key={child.id}>
                <Link href={`/persons/${child.id}`} className="text-blue-600 hover:underline">
                  {child.firstName} {child.lastName} ({child.gender === 'MALE' ? 'ذكر' : 'أنثى'})
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">لا يوجد أبناء</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">الزوجات/الأزواج ({spouses.length})</h2>
        {spouses.length > 0 ? (
          <ul className="space-y-2">
            {spouses.map((spouse: any) => (
              <li key={spouse.id} className="flex items-center justify-between">
                <Link href={`/persons/${spouse.id}`} className="text-blue-600 hover:underline">
                  {spouse.firstName} {spouse.lastName}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {spouse.marriage.isCurrent ? 'حالي' : 'سابق'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">لا يوجد زوجات/أزواج</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create app/persons/[id]/page.tsx**

```typescript
import { prisma } from '@/lib/prisma'
import { PersonDetail } from '@/components/person/person-detail'
import Link from 'next/link'

async function getPerson(id: string) {
  return prisma.person.findUnique({
    where: { id },
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
      childrenOfFather: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      childrenOfMother: {
        select: { id: true, firstName: true, lastName: true, gender: true },
      },
      marriagesAsPerson1: {
        include: {
          person2: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      marriagesAsPerson2: {
        include: {
          person1: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  })
}

export default async function PersonPage({
  params,
}: {
  params: { id: string }
}) {
  const person = await getPerson(params.id)

  if (!person) {
    return (
      <div className="container py-8">
        <p>الشخص غير موجود</p>
        <Link href="/persons" className="btn">
          العودة للقائمة
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Link href="/persons" className="btn btn-ghost mb-4">
        ← العودة للقائمة
      </Link>
      
      <PersonDetail person={person} />
    </div>
  )
}
```

- [ ] **Step 3: Test person detail page**

Navigate to a person detail page

- [ ] **Step 4: Commit**

```bash
git add components/person app/persons/\[id\]
git commit -m "feat: add person detail page with add child button"
```

---

## Task 7: Tree Visualization (React Flow)

**Files:**
- Create: `components/tree/family-tree.tsx`
- Create: `app/tree/page.tsx`

- [ ] **Step 1: Create FamilyTree component**

```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

interface PersonNode {
  id: string
  firstName: string
  lastName?: string
  gender: 'MALE' | 'FEMALE'
  isAlive: boolean
}

export function FamilyTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/persons?limit=500')
      .then(r => r.json())
      .then(data => {
        const persons: PersonNode[] = data.data

        // Build tree layout
        const treeNodes: Node[] = []
        const treeEdges: Edge[] = []
        
        // Group by parents
        const parentChildMap = new Map<string, string[]>()
        const childParentMap = new Map<string, { fatherId?: string; motherId?: string }>()
        
        persons.forEach(p => {
          parentChildMap.set(p.fatherId || 'none', [...(parentChildMap.get(p.fatherId || 'none') || []), p.id])
          if (p.fatherId || p.motherId) {
            childParentMap.set(p.id, { fatherId: p.fatherId, motherId: p.motherId })
          }
        })

        // Layout algorithm (simple levels)
        const levels = new Map<string, number>()
        const visited = new Set<string>()
        
        const getLevel = (id: string): number => {
          if (visited.has(id)) return levels.get(id) || 0
          visited.add(id)
          
          const parents = childParentMap.get(id)
          if (!parents || (!parents.fatherId && !parents.motherId)) {
            levels.set(id, 0)
            return 0
          }
          
          let maxLevel = 0
          if (parents.fatherId) {
            const p = persons.find(p => p.id === parents.fatherId)
            if (p) maxLevel = Math.max(maxLevel, getLevel(p.id) + 1)
          }
          if (parents.motherId) {
            const p = persons.find(p => p.id === parents.motherId)
            if (p) maxLevel = Math.max(maxLevel, getLevel(p.id) + 1)
          }
          
          levels.set(id, maxLevel)
          return maxLevel
        }

        persons.forEach(p => getLevel(p.id))

        // Assign positions
        const levelCounts = new Map<number, number>()
        
        persons
          .sort((a, b) => (levels.get(a.id) || 0) - (levels.get(b.id) || 0))
          .forEach(p => {
            const level = levels.get(p.id) || 0
            const count = levelCounts.get(level) || 0
            levelCounts.set(level, count + 1)

            treeNodes.push({
              id: p.id,
              position: { x: count * 200, y: level * 150 },
              data: { 
                label: `${p.firstName} ${p.lastName || ''}`,
                gender: p.gender,
                isAlive: p.isAlive,
              },
              style: {
                background: p.gender === 'MALE' ? '#e0f2fe' : '#fce7f3',
                border: p.isAlive ? '2px solid #22c55e' : '2px solid #ef4444',
                borderRadius: '8px',
                padding: '10px',
                minWidth: '150px',
              },
            })
          })

        // Create edges
        persons.forEach(p => {
          if (p.fatherId) {
            treeEdges.push({
              id: `e-${p.fatherId}-${p.id}`,
              source: p.fatherId,
              target: p.id,
              type: 'smoothstep',
            })
          }
          if (p.motherId) {
            treeEdges.push({
              id: `e-${p.motherId}-${p.id}`,
              source: p.motherId,
              target: p.id,
              type: 'smoothstep',
              style: { strokeDasharray: '5,5' },
            })
          }
        })

        setNodes(treeNodes)
        setEdges(treeEdges)
      })
  }, [setNodes, setEdges])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.id)
  }, [])

  return (
    <div className="h-[80vh] border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
      
      {selectedNode && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
          <a href={`/persons/${selectedNode}`} className="text-blue-600 hover:underline">
            عرض التفاصيل →
          </a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create app/tree/page.tsx**

```typescript
import { FamilyTree } from '@/components/tree/family-tree'
import Link from 'next/link'

export default function TreePage() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">شجرة العائلة</h1>
        <Link href="/persons" className="btn">
          القائمة ←
        </Link>
      </div>
      
      <FamilyTree />
    </div>
  )
}
```

- [ ] **Step 3: Test tree view**

Navigate to: http://localhost:3000/tree

- [ ] **Step 4: Commit**

```bash
git add components/tree app/tree
git commit -m "feat: add React Flow tree visualization"
```

---

## Task 8: Final Testing & Verification

- [ ] **Step 1: Test full workflow**

1. Navigate to /persons/new
2. Add a person (e.g., "أحمد", male)
3. Click "حفظ وإضافة طفل"
4. Add child (e.g., "علي", father pre-filled)
5. Verify tree shows correct relationship

- [ ] **Step 2: Verify criteria**

- [ ] Can create person with only firstName + gender
- [ ] Can link father and/or mother
- [ ] Can view spouses list
- [ ] Searchable dropdowns work
- [ ] "Save & Add Sibling" works
- [ ] "Add Child" button works

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: complete family tree application"
```

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-23-family-tree-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**