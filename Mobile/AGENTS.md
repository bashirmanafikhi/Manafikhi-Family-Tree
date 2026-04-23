# AGENTS.md

## Commands

```bash
npm start        # Start Expo dev server
npm run android # Run on Android emulator/device
npm run ios      # Run on iOS simulator
npm run web     # Run web version
```

## Architecture

- **Framework**: Expo SDK 54 + expo-router (file-based routing via `app/` dir)
- **Entry**: `app/index.tsx` reads canvas data, renders family tree; `app/person/[id].tsx` shows person details
- **Data Source**: Obsidian vault at `assets/manafikhi-obsidian/`
  - `tree.canvas` → node relationships (parsed by `src/parsers/canvas.ts`)
  - `people/*/*.md` → person details (parsed by `src/parsers/markdown.ts`)
- **State**: `src/context/FamilyContext.tsx` loads all canvas + person data on mount

## Testing

- No test framework configured. `npm start` runs Expo dev server, test manually on device/emulator.

## TypeScript

- Strict mode enabled (`tsconfig.json`). All types in `src/types/index.ts`.

## UI

- Arabic (RTL) in user-facing strings. Color codes from Obsidian canvas: `'1'-'5'` map to specific hex values in `app/index.tsx:17-26`.