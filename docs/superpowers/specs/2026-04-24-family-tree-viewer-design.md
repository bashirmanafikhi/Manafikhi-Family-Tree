# Specification: Manafikhi Family Tree Viewer

**Date:** 2026-04-24
**Project:** Manafikhi Family Tree Read-Only Viewer

---

## Overview

A read-only web application for browsing the Manafikhi family tree. Displays statistics, allows searching/filtering individuals, and provides detailed person pages with navigation to related family members.

## Technical Stack

- Next.js 14 (App Router)
- Prisma with SQLite
- Tailwind CSS
- Language: Arabic (RTL)

---

## Database

- Use a copy of `Web/prisma/dev.db` at `viewer/prisma/dev.db`
- Read-only access (no write operations)

---

## Pages

### 1. Home Page (Statistics)

**Route:** `/`

**Content:**
- Statistics cards in a grid:
  - Total persons count
  - Alive persons count
  - Deceased persons count
  - Males count
  - Females count
- Large centered button: "تصفح أفراد العائلة" navigates to `/persons`

**Design:** Match current Web project styling and colors

---

### 2. Persons List Page

**Route:** `/persons`

**Features:**

- **Filters:**
  - Gender (ذكر/أنثى)
  - Status (حي/متوفى)
  - Search by first name or last name
  - Search by father's name
  - Search by mother's name
  - Birth year range

- **Pagination:** 20 persons per page

- **Display columns:**
  - Name (first + last)
  - Father name
  - Mother name
  - Gender
  - Status

- Click row → navigate to person details

---

### 3. Person Detail Page

**Route:** `/persons/[id]`

**Content:**

- **Header:** Name, gender badge, status badge, birth/death dates
- **All fields:** First name, last name, nickname, gender, birth date, death date, status, profile image, bio

- **Navigation sections:**
  - **الوالدين** (Parents): Father and mother (or "غير محدد")
  - **الأبناء** (Children): List all children
  - **الازواج** (Spouses): List all marriages
  - **الاخوة** (Siblings): All siblings - same father OR same mother (not just same father)

- Click any person in these sections → navigate to their detail page

---

## UI/UX

- Same design language as `Web/` project:
  - Colors: `#0d5c63` (primary), `#e07a5f` (accent), `#4a9d7c` (teal), `#d94f4f` (red for deceased)
  - Gradients and cards
  - RTL layout
  - Arabic text throughout
  - Gender-specific colors (blue for males, coral for females)

---

## Deployment

- Deploy to Vercel (free tier)
- Use SQLite file in deployment (Prisma `db.url` pointing to file)