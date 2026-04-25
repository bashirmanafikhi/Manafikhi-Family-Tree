# Manafikhi Family Tree

A multi-platform family tree system consisting of an administration dashboard, a web viewer, and a mobile application.

## Project Structure

The repository is organized into three main projects:

| Directory | Component | Technology | Role |
|-----------|-----------|------------|------|
| [**`Web/`**](./Web) | Admin Dashboard | Next.js + Prisma + SQLite | **Source of Truth**. Used for managing family members, marriages, and relationships. |
| [**`viewer/`**](./viewer) | Web Viewer | Next.js (Static) | A beautiful, read-only web interface for family members to browse the tree. |
| [**`Mobile/`**](./Mobile) | Mobile App | React Native (Expo) | A read-only mobile application for on-the-go access. |

## Data Flow & Synchronization

This project uses a "Single Source of Truth" architecture:

1.  **Editing**: All data changes (adding people, updating details, managing marriages) are performed in the **Web** project.
2.  **Storage**: The Web project stores data in a SQLite database (`Web/prisma/dev.db`).
3.  **Synchronization**: To update the Viewer and Mobile apps, you must export the database to JSON format.
4.  **Consumption**: The Viewer and Mobile apps read from their respective `family.json` files.

### Critical Sync Command

Whenever you make changes in the Web dashboard, you **must** run the sync command to propagate changes:

```bash
cd Web
npm run db:sync
```

This script exports the database to:
- `viewer/public/data/family.json`
- `Mobile/assets/family.json`

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Running the Projects

**1. Admin Dashboard (Web)**
```bash
cd Web
npm install
npm run dev
```

**2. Web Viewer**
```bash
cd viewer
npm install
npm run dev
```

**3. Mobile App**
```bash
cd Mobile
npm install
npm start
```

## Maintenance Commands (Web Project)

- `npm run db:push`: Applies schema changes to the SQLite database.
- `npm run db:studio`: Opens a GUI to view and edit the database directly.
- `npm run db:sync`: Synchronizes data to the read-only apps (Viewer & Mobile).
- `npm run db:fill-names`: Utility script to propagate last names through generations.
