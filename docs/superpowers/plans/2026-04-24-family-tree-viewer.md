# Family Tree Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a read-only web application for browsing Manafikhi family tree with statistics, search/filter, and person details.

**Architecture:** Next.js 14 with App Router, Prisma with SQLite (read-only), Tailwind CSS. Copy existing dev.db from Web/prisma to viewer/prisma.

**Tech Stack:** Next.js 14, Prisma, SQLite, Tailwind CSS

---

## File Structure

```
viewer/
├── app/
│   ├── layout.tsx         # Root layout with nav
│   ├── page.tsx          # Home page (statistics)
│   ├── persons/
│   │   ├── page.tsx     # Persons list page
│   │   └── [id]/
│   │       └── page.tsx  # Person detail page
│   └── globals.css      # Global styles
├── components/
│   ├── stats-card.tsx   # Statistics card component
│   ├── person-row.tsx  # Person list row
│   ├── filters.tsx     # Filter component
│   └── ...           # Other components
├── lib/
│   └── prisma.ts     # Prisma client
├── prisma/
│   ├── dev.db        # Copied SQLite database
│   └── schema.prisma # Database schema
├── package.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## Tasks

### Task 1: Setup Project Structure

**Files:**
- Create: `viewer/package.json`
- Create: `viewer/next.config.mjs`
- Create: `viewer/tsconfig.json`
- Create: `viewer/prisma/schema.prisma`
- Create: `viewer/.env`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "viewer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@prisma/client": "^5.10.0",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "prisma": "^5.10.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create next.config.mjs**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default nextConfig
```

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

- [ ] **Step 4: Copy schema.prisma from Web**

Copy `Web/prisma/schema.prisma` to `viewer/prisma/schema.prisma`

- [ ] **Step 5: Create .env**

```
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 6: Install dependencies**

Run: `cd viewer && npm install`

---

### Task 2: Setup Tailwind & Global Styles

**Files:**
- Create: `viewer/tailwind.config.ts`
- Create: `viewer/postcss.config.js`
- Create: `viewer/app/globals.css`
- Modify: `viewer/app/layout.tsx`

- [ ] **Step 1: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d5c63",
        accent: "#e07a5f",
        teal: "#4a9d7c",
        deceased: "#d94f4f",
        "border-light": "#ede8e0",
        surface: "#faf9f7",
        "surface-muted": "#f0ede8",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #0d5c63, #14919b)",
        "gradient-teal": "linear-gradient(to right, #4a9d7c, #6bb89d)",
        "gradient-gold": "linear-gradient(to right, #d4a574, #e8c9a0)",
        "gradient-accent": "linear-gradient(to right, #e07a5f, #f2a98e)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 3: Create app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #faf9f7;
  --foreground: #2d2926;
}

body {
  background: var(--background);
  color: var(--foreground);
}

@layer components {
  .card {
    @apply bg-white rounded-2xl border border-border-light p-6;
  }
  
  .stat-card {
    @apply card;
  }
  
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-gradient-primary hover:opacity-90 transition-all;
  }
  
  .btn-outline {
    @apply inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all;
  }
  
  .input-field {
    @apply w-full px-4 py-3 rounded-xl border-2 border-border-light focus:border-primary focus:outline-none transition-colors;
  }
  
  .nav-link {
    @apply flex items-center gap-2 px-4 py-2 rounded-xl text-[#6b6560] hover:bg-surface-muted hover:text-primary transition-all;
  }
}
```

---

### Task 3: Copy Database

**Files:**
- Copy: `Web/prisma/dev.db` to `viewer/prisma/dev.db`
- Generate Prisma client

- [ ] **Step 1: Copy database file**

Copy the SQLite file from `Web/prisma/dev.db` to `viewer/prisma/dev.db`

- [ ] **Step 2: Generate Prisma client**

Run: `cd viewer && npx prisma generate`

---

### Task 4: Create Prisma Client & Layout

**Files:**
- Create: `viewer/lib/prisma.ts`
- Create: `viewer/app/layout.tsx`

- [ ] **Step 1: Create lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Create app/layout.tsx**

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "شجرة عائلة المنافيخي",
  description: "تصفح شجرة العائلة - Manafikhi Family Tree",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-border-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-gradient-primary">
                  ع
                </div>
                <span className="font-bold text-lg hidden sm:block text-primary">
                  عائلة المنافيخي
                </span>
              </Link>
              
              <div className="flex items-center gap-2">
                <Link href="/" className="nav-link">
                  الرئيسية
                </Link>
                <Link href="/persons" className="nav-link">
                  الأفراد
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="border-t border-border-light mt-auto py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm" style={{ color: '#6b6560' }}>
            <p>شجرة عائلة المنافيخي - Manafikhi Family Tree</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
```

---

### Task 5: Home Page (Statistics)

**Files:**
- Create: `viewer/app/page.tsx`

- [ ] **Step 1: Create app/page.tsx**

```typescript
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [totalPersons, aliveCount, deceasedCount, malesCount, femalesCount] = await Promise.all([
    prisma.person.count(),
    prisma.person.count({ where: { isAlive: true } }),
    prisma.person.count({ where: { isAlive: false } }),
    prisma.person.count({ where: { gender: "MALE" } }),
    prisma.person.count({ where: { gender: "FEMALE" } }),
  ]);
  
  return { totalPersons, aliveCount, deceasedCount, malesCount, femalesCount };
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen">
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-20 bg-gradient-primary" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full opacity-10 bg-gradient-gold" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style={{ color: '#0d5c63' }}>
              شجرة عائلة <span className="text-gradient">المنافيخي</span>
            </h1>
            <p className="text-xl sm:text-2xl mb-12" style={{ color: '#6b6560' }}>
              تصفح شجرة عائلتك العريقة
            </p>
            
            <Link href="/persons" className="btn-primary text-lg px-8 py-4">
              تصفح أفراد العائلة
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-primary">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#0d5c63' }}>{stats.totalPersons}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>إجمالي الأفراد</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-teal">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#4a9d7c' }}>{stats.aliveCount}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>أحياء</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-primary">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#0d5c63' }}>{stats.malesCount}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>ذكور</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-accent">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#e07a5f' }}>{stats.femalesCount}</p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>إناث</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

### Task 6: Persons List Page

**Files:**
- Create: `viewer/app/persons/page.tsx`
- Create: `viewer/components/filters.tsx`

- [ ] **Step 1: Create components/filters.tsx**

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Filters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [gender, setGender] = useState(searchParams.get('gender') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [fatherName, setFatherName] = useState(searchParams.get('father') || '')
  const [motherName, setMotherName] = useState(searchParams.get('mother') || '')

  useEffect(() => {
    const params = new URLSearchParams()
    if (gender) params.set('gender', gender)
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    if (fatherName) params.set('father', fatherName)
    if (motherName) params.set('mother', motherName)
    
    const query = params.toString()
    router.push(`/persons${query ? `?${query}` : ''}`)
  }, [gender, status, search, fatherName, motherName])

  return (
    <div className="card mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>الجنس</label>
          <select 
            value={gender} 
            onChange={(e) => setGender(e.target.value)}
            className="input-field"
          >
            <option value="">الكل</option>
            <option value="MALE">ذكر</option>
            <option value="FEMALE">أنثى</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>الحالة</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="input-field"
          >
            <option value="">الكل</option>
            <option value="alive">حي</option>
            <option value="deceased">متوفى</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>الاسم</label>
          <input
            type="text"
            placeholder="ابحث بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>اسم الأب</label>
          <input
            type="text"
            placeholder="ابحث باسم الأب..."
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#6b6560' }}>اسم الأم</label>
          <input
            type="text"
            placeholder="ابحث باسم الأم..."
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
            className="input-field"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create app/persons/page.tsx**

```typescript
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Filters } from "@/components/filters";

const PAGE_SIZE = 20;

async function getPersons(searchParams: { 
  gender?: string; 
  status?: string; 
  search?: string;
  father?: string;
  mother?: string;
  page?: string;
}) {
  const where: any = {}
  
  if (searchParams.gender) {
    where.gender = searchParams.gender
  }
  
  if (searchParams.status === 'alive') {
    where.isAlive = true
  } else if (searchParams.status === 'deceased') {
    where.isAlive = false
  }
  
  if (searchParams.search) {
    where.OR = [
      { firstName: { contains: searchParams.search } },
      { lastName: { contains: searchParams.search } },
    ]
  }

  const page = parseInt(searchParams.page || '1')
  const skip = (page - 1) * PAGE_SIZE

  // Get all persons first to filter by father/mother names
  let persons = await prisma.person.findMany({
    include: {
      father: { select: { firstName: true, lastName: true } },
      mother: { select: { firstName: true, lastName: true } },
    },
    orderBy: { firstName: 'asc' },
  })

  // Filter by father name
  if (searchParams.father) {
    persons = persons.filter(p => 
      p.father?.firstName?.includes(searchParams.father!) ||
      p.father?.lastName?.includes(searchParams.father!)
    )
  }

  // Filter by mother name
  if (searchParams.mother) {
    persons = persons.filter(p => 
      p.mother?.firstName?.includes(searchParams.mother!) ||
      p.mother?.lastName?.includes(searchParams.mother!)
    )
  }

  const total = persons.length
  const paginatedPersons = persons.slice(skip, skip + PAGE_SIZE)

  return { persons: paginatedPersons, total, page, totalPages: Math.ceil(total / PAGE_SIZE) }
}

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: { gender?: string; status?: string; search?: string; father?: string; mother?: string; page?: string }
}) {
  const { persons, total, page, totalPages } = await getPersons(searchParams)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: '#0d5c63' }}>
        أفراد العائلة
      </h1>

      <Filters />

      <div className="card overflow-hidden">
        <p className="mb-4 text-sm" style={{ color: '#6b6560' }}>
         showing {persons.length} من {total}فرد
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الاسم</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الأب</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الأم</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الجنس</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: '#6b6560' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((person) => (
                <tr key={person.id} className="border-b border-border-light hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-3">
                    <Link 
                      href={`/persons/${person.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        person.gender === 'MALE' 
                          ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
                          : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                      }`}>
                        {person.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                          {person.firstName} {person.lastName}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#6b6560' }}>
                    {person.father ? `${person.father.firstName} ${person.father.lastName || ''}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#6b6560' }}>
                    {person.mother ? `${person.mother.firstName} ${person.mother.lastName || ''}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      person.gender === 'MALE' 
                        ? 'bg-[#e0f2fe] text-[#0d5c63]' 
                        : 'bg-[#fce7f3] text-[#e07a5f]'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        person.gender === 'MALE' ? 'bg-[#0d5c63]' : 'bg-[#e07a5f]'
                      }`} />
                      {person.gender === 'MALE' ? 'ذكر' : 'أنثى'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      person.isAlive 
                        ? 'bg-[#e6f4ef] text-[#4a9d7c]' 
                        : 'bg-[#f5e6e6] text-[#d94f4f]'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        person.isAlive ? 'bg-[#4a9d7c]' : 'bg-[#d94f4f]'
                      }`} />
                      {person.isAlive ? 'حي' : 'متوفى'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {page > 1 && (
              <Link href={`/persons?page=${page - 1}`} className="btn-outline">
                السابق
              </Link>
            )}
            <span className="px-4" style={{ color: '#6b6560' }}>
              صفحة {page} من {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/persons?page=${page + 1}`} className="btn-outline">
                التالي
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### Task 7: Person Detail Page

**Files:**
- Create: `viewer/app/persons/[id]/page.tsx`

- [ ] **Step 1: Create app/persons/[id]/page.tsx**

```typescript
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getPerson(id: string) {
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
      childrenOfFather: { select: { id: true, firstName: true, lastName: true, gender: true } },
      childrenOfMother: { select: { id: true, firstName: true, lastName: true, gender: true } },
      marriagesAsPerson1: {
        include: { person2: { select: { id: true, firstName: true, lastName: true, gender: true } } }
      },
      marriagesAsPerson2: {
        include: { person1: { select: { id: true, firstName: true, lastName: true, gender: true } } }
      },
    },
  });

  if (!person) return null;

  // Get siblings - same father OR same mother
  let siblings: any[] = []
  
  if (person.fatherId) {
    const fathersChildren = await prisma.person.findMany({
      where: { fatherId: person.fatherId, id: { not: person.id } },
      select: { id: true, firstName: true, lastName: true, gender: true }
    })
    siblings.push(...fathersChildren)
  }
  
  if (person.motherId) {
    const mothersChildren = await prisma.person.findMany({
      where: { motherId: person.motherId, id: { not: person.id } },
      select: { id: true, firstName: true, lastName: true, gender: true }
    })
    siblings.push(...mothersChildren)
  }
  
  // Remove duplicates
  siblings = siblings.filter((s, index, self) => index === self.findIndex(x => x.id === s.id))

  return { person, siblings };
}

export default async function PersonDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const data = await getPerson(params.id)
  
  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/persons" className="btn-ghost mb-6 inline-flex">
          ← العودة للقائمة
        </Link>
        <div className="card text-center py-12">
          <p className="text-lg" style={{ color: '#6b6560' }}>الشخص غير موجود</p>
        </div>
      </div>
    )
  }

  const { person, siblings } = data
  
  const children = [
    ...(person.childrenOfFather || []),
    ...(person.childrenOfMother || []),
  ]
  const uniqueChildren = children.filter((c, index, self) => index === self.findIndex(t => t.id === c.id))

  const spouses = [
    ...(person.marriagesAsPerson1 || []).map(m => ({
      ...m.person2,
      isCurrent: m.isCurrent,
    })),
    ...(person.marriagesAsPerson2 || []).map(m => ({
      ...m.person1,
      isCurrent: m.isCurrent,
    })),
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/persons" className="btn-ghost mb-6 inline-flex">
        ← العودة للقائمة
      </Link>

      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ${
            person.gender === 'MALE' 
              ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
              : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
          }`}>
            {person.firstName.charAt(0)}
          </div>
          
          <div className="flex-1 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold" style={{ color: '#2d2926' }}>
                {person.firstName} {person.lastName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm ${
                person.isAlive 
                  ? 'bg-[#e6f4ef] text-[#4a9d7c]' 
                  : 'bg-[#f5e6e6] text-[#d94f4f]'
              }`}>
                {person.isAlive ? 'حي' : 'متوفى'}
              </span>
            </div>
            {person.nickname && (
              <p className="text-lg" style={{ color: '#6b6560' }}>
                ({person.nickname})
              </p>
            )}
            <p className="text-lg" style={{ color: '#6b6560' }}>
              {person.gender === 'MALE' ? 'ذكر' : 'أنثى'}
            </p>
            <p className="text-sm mt-1" style={{ color: '#9c9690' }}>
              {person.birthDate 
                ? `الميلاد: ${new Date(person.birthDate).toLocaleDateString('ar')}`
                : ''}
              {!person.isAlive && person.deathDate 
                ? ` - الوفاة: ${new Date(person.deathDate).toLocaleDateString('ar')}`
                : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
            الوالدين
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm" style={{ color: '#9c9690' }}>الأب</label>
              {person.father ? (
                <Link href={`/persons/${person.father.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-[#0d5c63] to-[#14919b]">
                    {person.father.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                      {person.father.firstName} {person.father.lastName}
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm p-3" style={{ color: '#9c9690' }}>غير محدد</p>
              )}
            </div>
            
            <div>
              <label className="text-sm" style={{ color: '#9c9690' }}>الأم</label>
              {person.mother ? (
                <Link href={`/persons/${person.mother.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]">
                    {person.mother.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#e07a5f]" style={{ color: '#2d2926' }}>
                      {person.mother.firstName} {person.mother.lastName}
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm p-3" style={{ color: '#9c9690' }}>غير محدد</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#e07a5f' }}>
            الأزواج ({spouses.length})
          </h2>
          
          {spouses.length > 0 ? (
            <ul className="space-y-3">
              {spouses.map((spouse: any) => (
                <li key={spouse.id}>
                  <Link href={`/persons/${spouse.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      spouse.gender === 'MALE' 
                        ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
                        : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                    }`}>
                      {spouse.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                        {spouse.firstName} {spouse.lastName}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        spouse.isCurrent 
                          ? 'bg-[#e6f4ef] text-[#4a9d7c]' 
                          : 'bg-[#f0ede8] text-[#6b6560]'
                      }`}>
                        {spouse.isCurrent ? 'حالي' : 'سابق'}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: '#9c9690' }}>لا يوجد ازواج</p>
          )}
        </div>
      </div>

      <div className="card p-6 mt-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
          الأبناء ({uniqueChildren.length})
        </h2>
        
        {uniqueChildren.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uniqueChildren.map((child: any) => (
              <Link key={child.id} href={`/persons/${child.id}`} className="p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    child.gender === 'MALE' 
                      ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
                      : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                  }`}>
                    {child.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-xs" style={{ color: '#9c9690' }}>
                      {child.gender === 'MALE' ? 'ذكر' : 'أنثى'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#9c9690' }}>لا يوجد أبناء</p>
        )}
      </div>

      {siblings.length > 0 && (
        <div className="card p-6 mt-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#0d5c63' }}>
            الاخوة ({siblings.length})
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {siblings.map((sibling: any) => (
              <Link key={sibling.id} href={`/persons/${sibling.id}`} className="p-3 rounded-xl hover:bg-[#f0ede8] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    sibling.gender === 'MALE' 
                      ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' 
                      : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                  }`}>
                    {sibling.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-[#0d5c63]" style={{ color: '#2d2926' }}>
                      {sibling.firstName} {sibling.lastName}
                    </p>
                    <p className="text-xs" style={{ color: '#9c9690' }}>
                      {sibling.gender === 'MALE' ? 'أخ' : 'أخت'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

### Task 8: Build and Test

- [ ] **Step 1: Generate Prisma client**

Run: `cd viewer && npx prisma generate`

- [ ] **Step 2: Build the project**

Run: `cd viewer && npm run build`

- [ ] **Step 3: Start dev server**

Run: `cd viewer && npm run dev`

- [ ] **Step 4: Test locally**

Open: `http://localhost:3000`

---

### Task 9: Deploy to Vercel

- [ ] **Step 1: Create GitHub repository (optional)**

- [ ] **Step 2: Deploy to Vercel**

Follow Vercel deployment instructions with SQLite database

---

## Notes

- All pages use server components for SQLite read-only access
- Filters component uses client component for URL parameters
- Pagination uses URL query parameter
- Same design language as existing Web project