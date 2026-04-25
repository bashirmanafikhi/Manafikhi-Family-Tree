# Manafikhi Family Tree

## Projects

| Directory | Purpose | Data Source |
|-----------|---------|-------------|
| `Web/` | Admin dashboard (Next.js) | SQLite (Prisma) |
| `Mobile/` | Read-only mobile app (Expo) | `Mobile/assets/family.json` |
| `viewer/` | Read-only web viewer (Next.js) | `viewer/public/data/family.json` |

## Critical Commands

```bash
# In Web/
npm run db:sync    # Export SQLite data to family.json for Mobile/viewer
npm run db:push   # Apply Prisma schema to database
npm run db:studio # Open Prisma Studio GUI
```

**Always run `npm run db:sync` after making changes in Web** to propagate data to Mobile/viewer.

## Data Flow

1. Admin edits family data in **Web** (SQLite/Prisma)
2. `npm run db:sync` exports to:
   - `viewer/public/data/family.json`
   - `Mobile/assets/family.json`
3. **Mobile** and **viewer** read family.json (read-only)

## Running Individual Projects

```bash
# Web
cd Web && npm run dev

# Mobile
cd Mobile && npm start

# viewer
cd viewer && npm run dev
```

## Notes

- Mobile and viewer are **read-only** - no edits propagate back
- family.json structure: `{ persons: Person[], marriages: Marriage[] }`
- Web uses Prisma with SQLite at `Web/prisma/dev.db`