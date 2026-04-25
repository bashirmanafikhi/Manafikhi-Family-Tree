# Person Profile Images Feature — Design Spec

## Context

The family tree app currently stores `profileImage` and `additionalImages` fields in the database but has no UI to add or view images. This spec covers adding image upload in the Web admin app, compression, and syncing images to the read-only viewer and mobile apps.

## Decisions

| Question | Decision |
|---|---|
| Storage | File paths in DB + image files on disk |
| Storage layout | Per-person subdirectories |
| Upload UI | Simple file input button |
| Compression | Max 600×600px, ~60KB per image |
| Deletion | Delete file from disk when removed |
| Fallback | Initials avatar (existing behavior) |
| Additional images | Thumbnail strip below profile image |
| Sync | Automatic — `db:sync` copies images alongside JSON |
| Path consistency | Same relative path used across all 3 projects |

## Storage Architecture

### Directory Structure

```
Web/public/images/persons/{personId}/
├── profile.jpg
└── gallery/
    ├── 0.jpg
    ├── 1.jpg
    └── 2.jpg

viewer/public/images/persons/{personId}/
├── profile.jpg
└── gallery/
    ├── 0.jpg
    ├── 1.jpg
    └── 2.jpg

Mobile/assets/images/persons/{personId}/
├── profile.jpg
└── gallery/
    ├── 0.jpg
    ├── 1.jpg
    └── 2.jpg
```

### Image Path Convention

The DB stores a **portable relative path** that is identical across all three projects:

- Profile: `images/persons/{personId}/profile.jpg`
- Gallery: `images/persons/{personId}/gallery/0.jpg`

Each project resolves this path from its own root:
- **Web/viewer:** serves from `public/images/...`
- **Mobile:** imports from `assets/images/...` via `expo-asset`

This means the same path string works in all three apps without transformation.

## Data Layer

### Prisma Schema — unchanged
`profileImage: String?` and `additionalImages: String?` (JSON array) already exist.

### DB Values after upload

```
profileImage      = "images/persons/cmobxxx/profile.jpg"
additionalImages  = '["images/persons/cmobxxx/gallery/0.jpg","images/persons/cmobxxx/gallery/1.jpg"]'
```

## Web App — Image Upload & Display

### Person Detail (view mode)
- Replace the gradient avatar circle with `<img>` if `profileImage` is set
- Fall back to existing gradient initial avatar when no image exists
- Show thumbnail strip for `additionalImages` below the profile image (if any)
- Thumbnails are clickable — clicking opens a lightbox/modal with the full image

### Person Form (new person) & Person Detail (edit mode)
- Add an image upload section in the form between the profile header and basic info fields
- Two sections: **Profile Image** and **Additional Images**
- **Profile Image:** standard file input button, single image
- **Additional Images:** standard file input with `multiple` attribute
- Show image previews after selection (before submit)
- Existing images show with a delete (X) button to remove them
- All selected images are compressed client-side before upload

### Image Compression (client-side)

Use the browser's Canvas API to resize and compress:
- Max dimension: 600×600px (preserve aspect ratio)
- Quality: 0.7 JPEG
- Target: ~60KB or less per image
- Done in-browser before upload; no server-side processing needed

### Upload API

New endpoint: `POST /api/persons/{id}/images`

- `FormData` body with fields:
  - `profileImage` (optional file) — replaces existing profile image
  - `additionalImages` (optional files array) — appended to existing gallery
- Compress client-side before upload
- Save to `Web/public/images/persons/{id}/`
- Delete old file when replacing profile image
- Return updated `{ profileImage, additionalImages }` paths

New endpoint: `DELETE /api/persons/{id}/images`

- Query param: `type=profile|gallery&index=N`
- Delete the specified file from disk
- Update DB accordingly

### Web App File Structure

```
Web/
├── public/images/persons/          # uploaded images (committed to git)
├── app/api/persons/[id]/route.ts    # existing — add image endpoints
└── components/
    ├── person/person-detail.tsx    # add image display + edit section
    └── forms/person-form.tsx       # add image upload fields
```

## Viewer App — Display Only

### Person Detail page (`viewer/app/persons/[id]/page.tsx`)
- Replace avatar circles with `<img>` if `profileImage` is set
- Fall back to gradient initial avatar when no image
- Show thumbnail strip for `additionalImages`
- Thumbnails link to full-size images (open in new tab or modal)

### Person List page (`viewer/app/persons/page.tsx`)
- Small avatar thumbnails (40×40px) next to each name if `profileImage` exists

## Mobile App — Display Only

### Person Detail screen (`Mobile/app/person/[id].tsx`)
- Replace the gender icon fallback with `<Image>` if `profileImage` is set
- Fall back to existing gender icon when no image
- Show thumbnail strip for `additionalImages`
- Tap thumbnail to expand

### Image Loading (Mobile)
- Use `require('../../assets/images/persons/{id}/profile.jpg')` for static references
- Since images are bundled at build time via `expo-asset`, the `family.json` export path must match exactly where images are placed in `Mobile/assets/images/`
- No lazy loading needed — images are small (≤60KB)

## Export Script — `db:sync`

Updated `Web/scripts/export-json.ts`:

1. Read all persons from DB
2. Write `family.json` to `viewer/public/data/` and `Mobile/assets/`
3. Copy `Web/public/images/persons/` → `viewer/public/images/persons/`
4. Copy `Web/public/images/persons/` → `Mobile/assets/images/persons/`

Files are copied using Node.js `fs.cp` or equivalent.

## Build & Deployment Notes

- `Web/public/images/persons/` should be committed to git — these are the source of truth
- `viewer/public/images/` and `Mobile/assets/images/` are generated by `db:sync` — can be `.gitignore`'d or kept depending on team workflow
- Images must be ≤ 600×600px JPEG — enforce at upload time

## Scope

**In scope:**
- Upload profile image (Web admin)
- Upload additional images (Web admin)
- Delete images (Web admin)
- Display images (all three apps)
- Image compression (client-side, at upload)
- `db:sync` copies images to all projects

**Out of scope:**
- Image editing/cropping
- Server-side compression
- Cloud storage
- Image thumbnails generation (serve full image at small display size)