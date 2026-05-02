# Manafikhi Family Tree

## Projects

| Directory | Purpose | Data Source |
|-----------|---------|-------------|
| `web/` | Admin dashboard (Next.js) | SQLite (Prisma) |
| Directory | Purpose | Data Source |
|-----------|---------|-------------|
| `web/` | Admin dashboard (Next.js) | SQLite (Prisma) |
| `mobile/` | Read-only mobile app (Expo) | `mobile/assets/family.json` |
| `viewer/` | Read-only web viewer (Next.js) | `viewer/public/data/family.json` |

## Critical Commands

```bash
# In web/
npm run db:sync    # Export SQLite data to family.json for mobile/viewer
npm run db:push   # Apply Prisma schema to database
npm run db:studio # Open Prisma Studio GUI
```

**Always run `npm run db:sync` after making changes in web** to propagate data to mobile/viewer.

## Data Flow

1. Admin edits family data in **web** (SQLite/Prisma)
2. `npm run db:sync` exports to:
   - `viewer/public/data/family.json`
   - `mobile/assets/family.json`
3. **mobile** and **viewer** read family.json (read-only)

## Running Individual Projects

```bash
# web
cd web && npm run dev

# mobile
cd mobile && npm start

# viewer
cd viewer && npm run dev
```

## Notes

- mobile and viewer are **read-only** - no edits propagate back
- family.json structure: `{ persons: Person[], marriages: Marriage[] }`
- web uses Prisma with SQLite at `web/prisma/dev.db`