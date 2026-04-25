# Person Profile Images — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image upload in Web admin, compress client-side, sync to viewer/mobile, display images in all three apps.

**Architecture:** Images stored as JPEG files under `Web/public/images/persons/{id}/`. DB stores portable relative paths (`images/persons/{id}/profile.jpg`). Export script copies images to viewer and mobile. All three apps resolve the same relative path from their own root.

**Tech Stack:** Browser Canvas API (compression), Next.js API routes (upload), Node.js fs (export), expo-asset (mobile), Next.js Image component (viewer).

---

## File Map

### New files
- `Web/app/api/persons/[id]/images/route.ts` — upload + delete endpoints
- `Web/lib/image-utils.ts` — client-side compression utility
- `Web/public/images/persons/` — source of truth for images (created at upload)

### Modify existing files
- `Web/scripts/export-json.ts` — add image copy step
- `Web/components/person/person-detail.tsx` — add image display + edit section in view and edit modes
- `Web/components/forms/person-form.tsx` — add image upload fields (for new person, profile image optional)
- `viewer/lib/data.ts` — add `additionalImages` to `Person` interface
- `viewer/app/persons/[id]/page.tsx` — add image display
- `viewer/app/persons/page.tsx` — add thumbnail avatars in list
- `Mobile/app/person/[id].tsx` — add image display + thumbnail gallery

---

## Task 1: Image Compression Utility

**Files:**
- Create: `Web/lib/image-utils.ts`
- Test: (manual — no test framework configured)

- [ ] **Step 1: Create the compression utility**

```typescript
// Web/lib/image-utils.ts

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

export async function compressImage(file: File, maxSize = 600, quality = 0.7): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width, height });
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: 'image/jpeg' });
}
```

---

## Task 2: Image Upload/Delete API

**Files:**
- Create: `Web/app/api/persons/[id]/images/route.ts`
- Modify: `Web/app/api/persons/[id]/route.ts:100-138` (add image folder deletion on person delete)

- [ ] **Step 1: Create the images API route**

```typescript
// Web/app/api/persons/[id]/images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const IMAGE_BASE = path.join(process.cwd(), 'public', 'images', 'persons');

function personImageDir(personId: string): string {
  return path.join(IMAGE_BASE, personId);
}

function personImagePath(personId: string, filename: string): string {
  return path.join(personImageDir(personId), filename);
}

function portablePath(personId: string, filename: string): string {
  return `images/persons/${personId}/${filename}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const personId = params.id;
  const formData = await request.formData();

  const profileFile = formData.get('profileImage') as File | null;
  const additionalFiles = formData.getAll('additionalImages') as File[];

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 });
  }

  const dir = personImageDir(personId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
    await mkdir(path.join(dir, 'gallery'), { recursive: true });
  }

  let newProfileImage: string | null = person.profileImage;
  let existingGallery: string[] = [];

  try {
    existingGallery = person.additionalImages ? JSON.parse(person.additionalImages) : [];
  } catch {
    existingGallery = [];
  }

  // Handle profile image upload
  if (profileFile && profileFile.size > 0) {
    // Delete old profile image
    if (person.profileImage) {
      const oldPath = path.join(process.cwd(), 'public', person.profileImage);
      if (existsSync(oldPath)) {
        await rm(oldPath);
      }
    }

    const filename = 'profile.jpg';
    const buffer = Buffer.from(await profileFile.arrayBuffer());
    await writeFile(personImagePath(personId, filename), buffer);
    newProfileImage = portablePath(personId, filename);
  }

  // Handle additional images upload
  let newGallery = [...existingGallery];
  if (additionalFiles.length > 0) {
    const startIndex = existingGallery.length;
    for (let i = 0; i < additionalFiles.length; i++) {
      const file = additionalFiles[i];
      if (!file || file.size === 0) continue;
      const filename = `${startIndex + i}.jpg`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, 'gallery', filename), buffer);
      newGallery.push(portablePath(personId, `gallery/${filename}`));
    }
  }

  await prisma.person.update({
    where: { id: personId },
    data: {
      profileImage: newProfileImage,
      additionalImages: JSON.stringify(newGallery),
    },
  });

  revalidatePath('/persons');
  revalidatePath(`/persons/${personId}`);

  return NextResponse.json({ profileImage: newProfileImage, additionalImages: newGallery });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'profile' | 'gallery'
  const index = searchParams.get('index'); // gallery index (string number)

  const personId = params.id;

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 });
  }

  if (type === 'profile') {
    if (person.profileImage) {
      const fullPath = path.join(process.cwd(), 'public', person.profileImage);
      if (existsSync(fullPath)) {
        await rm(fullPath);
      }
    }
    await prisma.person.update({
      where: { id: personId },
      data: { profileImage: null },
    });
  } else if (type === 'gallery') {
    const gallery: string[] = person.additionalImages ? JSON.parse(person.additionalImages) : [];
    const idx = parseInt(index || '0', 10);
    if (idx >= 0 && idx < gallery.length) {
      const filePath = gallery[idx];
      const fullPath = path.join(process.cwd(), 'public', filePath);
      if (existsSync(fullPath)) {
        await rm(fullPath);
      }
      gallery.splice(idx, 1);
      await prisma.person.update({
        where: { id: personId },
        data: { additionalImages: JSON.stringify(gallery) },
      });
    }
  }

  revalidatePath('/persons');
  revalidatePath(`/persons/${personId}`);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Update person DELETE to also delete images**

In `Web/app/api/persons/[id]/route.ts`, add image folder deletion at the start of the DELETE handler:

```typescript
// Add after line 104 (after "const personId = params.id")
// Delete person's image folder
const personImageDirPath = path.join(process.cwd(), 'public', 'images', 'persons', personId);
if (existsSync(personImageDirPath)) {
  await rm(personImageDirPath, { recursive: true });
}
```

And add `import { existsSync } from 'fs'` and `import path from 'path'` and `import { rm } from 'fs/promises'` at the top.

---

## Task 3: Update Export Script

**Files:**
- Modify: `Web/scripts/export-json.ts`

- [ ] **Step 1: Add image copy to export-json.ts**

Read the file first, then add these imports at the top:

```typescript
import { existsSync, cp } from 'fs';
import { mkdir } from 'fs/promises';
```

Add this block after the existing console.log and before writing family.json:

```typescript
// Copy images to viewer and mobile
const imagesSrc = path.join(__dirname, '..', 'public', 'images', 'persons');
const imagesViewerDest = path.join(__dirname, '..', '..', 'viewer', 'public', 'images', 'persons');
const imagesMobileDest = path.join(__dirname, '..', '..', 'Mobile', 'assets', 'images', 'persons');

if (existsSync(imagesSrc)) {
  await mkdir(path.dirname(imagesViewerDest), { recursive: true });
  await cp(imagesSrc, imagesViewerDest, { recursive: true });
  console.log('Copied images to viewer');

  await mkdir(path.dirname(imagesMobileDest), { recursive: true });
  await cp(imagesSrc, imagesMobileDest, { recursive: true });
  console.log('Copied images to mobile');
}
```

Also update the person query to include the image fields:

```typescript
const [persons, marriages] = await Promise.all([
  prisma.person.findMany({
    include: {
      father: { select: { id: true, firstName: true, lastName: true } },
      mother: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { firstName: 'asc' },
  }),
  prisma.marriage.findMany(),
]);
```

The export already includes all fields since Prisma returns the full model by default when not specifying `select`.

---

## Task 4: Web App — Image Display in Person Detail

**Files:**
- Modify: `Web/components/person/person-detail.tsx`

- [ ] **Step 1: Add image display to the view mode**

In the view mode JSX, find the avatar section (around lines 279-285):

Replace:
```tsx
<div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ${person.gender === 'MALE'
  ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]'
  : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
  }`}>
  {person.firstName.charAt(0)}
</div>
```

With a profile image check + fallback:

```tsx
{person.profileImage ? (
  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
    <img
      src={`/${person.profileImage}`}
      alt={`${person.firstName} ${person.lastName || ''}`}
      className="w-full h-full object-cover"
    />
  </div>
) : (
  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ${
    person.gender === 'MALE'
      ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]'
      : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
  }`}>
    {person.firstName.charAt(0)}
  </div>
)}
```

- [ ] **Step 2: Add thumbnail strip for additional images**

After the profile header card's `div className="card p-6 sm:p-8 mb-6"`, add this thumbnail section. Find the closing `</div>` of that card and add before it:

```tsx
{person.additionalImages && person.additionalImages.length > 0 && (
  <div className="card p-4 mb-6">
    <div className="flex gap-2 overflow-x-auto pb-2">
      {(JSON.parse(person.additionalImages) as string[]).map((img: string, idx: number) => (
        <button
          key={idx}
          onClick={() => window.open(`/${img}`, '_blank')}
          className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
        >
          <img src={`/${img}`} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  </div>
)}
```

Note: `person.additionalImages` comes from Prisma as a JSON string, so parse it in the template.

---

## Task 5: Web App — Image Upload Section in Person Detail (Edit Mode)

**Files:**
- Modify: `Web/components/person/person-detail.tsx`

- [ ] **Step 1: Add image upload state variables**

After the existing `useState` declarations near the top of `PersonDetail`, add:

```tsx
const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
const [selectedAdditionalImages, setSelectedAdditionalImages] = useState<File[]>([]);
const [uploadPreview, setUploadPreview] = useState<string | null>(null);
const [isUploading, setIsUploading] = useState(false);
```

Also add these imports at the top of the file:

```tsx
import { compressImage, blobToFile } from '@/lib/image-utils';
```

- [ ] **Step 2: Add image upload handlers**

Add these functions before the `handleSave` function:

```tsx
const handleProfileImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const compressed = await compressImage(file);
    const fileObj = blobToFile(compressed.blob, 'profile.jpg');
    setSelectedProfileImage(fileObj);
    setUploadPreview(URL.createObjectURL(compressed.blob));
  } catch (err) {
    console.error('Failed to compress image', err);
  }
};

const handleAdditionalImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const compressed = await Promise.all(files.map(f => compressImage(f)));
  const fileObjs = compressed.map((c, i) => blobToFile(c.blob, `${Date.now()}_${i}.jpg`));
  setSelectedAdditionalImages(prev => [...prev, ...fileObjs]);
};

const handleRemoveAdditionalPreview = (index: number) => {
  setSelectedAdditionalImages(prev => prev.filter((_, i) => i !== index));
};

const handleUploadImages = async () => {
  setIsUploading(true);
  try {
    const fd = new FormData();
    if (selectedProfileImage) {
      fd.append('profileImage', selectedProfileImage);
    }
    for (const file of selectedAdditionalImages) {
      fd.append('additionalImages', file);
    }
    const res = await fetch(`/api/persons/${person.id}/images`, {
      method: 'POST',
      body: fd,
    });
    if (res.ok) {
      setSelectedProfileImage(null);
      setSelectedAdditionalImages([]);
      setUploadPreview(null);
      router.refresh();
    }
  } catch (err) {
    console.error('Upload failed', err);
  } finally {
    setIsUploading(false);
  }
};

const handleDeleteImage = async (type: 'profile' | 'gallery', index?: number) => {
  const url = `/api/persons/${person.id}/images?type=${type}${index !== undefined ? `&index=${index}` : ''}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (res.ok) {
    router.refresh();
  }
};
```

- [ ] **Step 3: Add image upload UI to the edit mode form**

Find the edit mode form's closing section (around line 755, the Actions div with Save/Cancel buttons). Add the image upload section before it:

```tsx
{/* Images */}
<div className="border-t pt-6" style={{ borderColor: '#ede8e0' }}>
  <h3 className="text-sm font-bold mb-4" style={{ color: '#2d2926' }}>الصور</h3>

  {/* Current Profile Image */}
  <div className="mb-4">
    <label className="block text-sm mb-2" style={{ color: '#6b6560' }}>صورة البروفايل</label>
    <div className="flex items-center gap-4">
      {person.profileImage ? (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden">
          <img src={`/${person.profileImage}`} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => handleDeleteImage('profile')}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="w-20 h-20 rounded-xl bg-[#f0ede8] flex items-center justify-center text-[#9c9690]">
          لا توجد صورة
        </div>
      )}
      <label className="btn-outline cursor-pointer text-sm">
        اختر صورة
        <input type="file" accept="image/*" onChange={handleProfileImageSelect} className="hidden" />
      </label>
    </div>
    {uploadPreview && (
      <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden">
        <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
      </div>
    )}
  </div>

  {/* Current Additional Images */}
  {person.additionalImages && (() => {
    const imgs = JSON.parse(person.additionalImages) as string[];
    return imgs.length > 0 ? (
      <div className="mb-4">
        <label className="block text-sm mb-2" style={{ color: '#6b6560' }}>صور إضافية ({imgs.length})</label>
        <div className="flex flex-wrap gap-2">
          {imgs.map((img: string, idx: number) => (
            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
              <img src={`/${img}`} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDeleteImage('gallery', idx)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    ) : null;
  })()}

  {/* New Additional Images */}
  <div className="mb-4">
    <label className="block text-sm mb-2" style={{ color: '#6b6560' }}>إضافة صور جديدة</label>
    <label className="btn-outline cursor-pointer text-sm">
      اختر ملفات
      <input type="file" accept="image/*" multiple onChange={handleAdditionalImagesSelect} className="hidden" />
    </label>
    {selectedAdditionalImages.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedAdditionalImages.map((file, idx) => (
          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => handleRemoveAdditionalPreview(idx)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    )}
  </div>

  {(selectedProfileImage || selectedAdditionalImages.length > 0) && (
    <button
      onClick={handleUploadImages}
      disabled={isUploading}
      className="btn-primary"
    >
      {isUploading ? 'جاري الرفع...' : 'رفع الصور'}
    </button>
  )}
</div>
```

---

## Task 6: Web App — Image Upload in New Person Form

**Files:**
- Modify: `Web/components/forms/person-form.tsx`

- [ ] **Step 1: Add image state and handlers**

Add at the top with imports:
```tsx
import { compressImage, blobToFile } from '@/lib/image-utils';
```

Add state in `PersonForm`:
```tsx
const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
const [profilePreview, setProfilePreview] = useState<string | null>(null);
```

Add handlers after the `handleSubmit` function:
```tsx
const handleProfileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const compressed = await compressImage(file);
  const fileObj = blobToFile(compressed.blob, 'profile.jpg');
  setSelectedProfileImage(fileObj);
  setProfilePreview(URL.createObjectURL(compressed.blob));
};
```

- [ ] **Step 2: Update handleSubmit to send image as FormData**

Replace the `handleSubmit` function to check if there's a profile image and use FormData:

```tsx
const handleSubmit = async (action: 'continue' | 'addChild' | 'addSibling') => {
  setIsSubmitting(true);
  try {
    if (selectedProfileImage) {
      const fd = new FormData();
      fd.append('firstName', formData.firstName);
      fd.append('lastName', formData.lastName || '');
      fd.append('nickname', formData.nickname || '');
      fd.append('gender', formData.gender);
      fd.append('isAlive', String(formData.isAlive));
      fd.append('birthDate', formData.birthDate || '');
      if (!formData.isAlive) fd.append('deathDate', formData.deathDate || '');
      if (formData.fatherId) fd.append('fatherId', formData.fatherId);
      if (formData.motherId) fd.append('motherId', formData.motherId);
      fd.append('profileImage', selectedProfileImage);

      // Create person first, then upload image
      const res = await fetch('/api/persons', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Failed to create');
      const person = await res.json();
      navigateAfterSubmit(person, action);
    } else {
      const res = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create');
      const person = await res.json();
      navigateAfterSubmit(person, action);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};

const navigateAfterSubmit = (person: any, action: 'continue' | 'addChild' | 'addSibling') => {
  if (action === 'continue') {
    router.push('/persons');
  } else if (action === 'addChild') {
    router.push(`/persons/new?fatherId=${person.id}&motherId=${formData.motherId || ''}`);
  } else if (action === 'addSibling') {
    router.push(`/persons/new?fatherId=${formData.fatherId || ''}&motherId=${formData.motherId || ''}`);
  }
};
```

- [ ] **Step 3: Update the POST API to accept FormData**

The API at `Web/app/api/persons/route.ts` needs to accept both JSON and FormData. Let me check the current implementation:

```typescript
// Web/app/api/persons/route.ts - update POST handler
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  let data: any;
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const entries: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key === 'profileImage') {
        entries[key] = value; // File object - handled separately
      } else {
        entries[key] = value;
      }
    });
    data = entries;
  } else {
    data = await request.json();
  }

  // Handle profile image file upload
  let profileImagePath: string | null = null;
  if (data.profileImage && typeof data.profileImage === 'object') {
    const personId = generateId(); // You'll need to create person first then update, so this needs refactoring
    // Actually, let's create the person first, then upload the image
  }

  // ... rest of the handler
}
```

Actually, the cleanest approach: create the person first via JSON, then upload the image separately. Update `handleSubmit`:

```tsx
const handleSubmit = async (action: 'continue' | 'addChild' | 'addSibling') => {
  setIsSubmitting(true);
  try {
    // Create person first
    const res = await fetch('/api/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Failed to create');
    const person = await res.json();

    // Upload profile image if selected
    if (selectedProfileImage) {
      const fd = new FormData();
      fd.append('profileImage', selectedProfileImage);
      await fetch(`/api/persons/${person.id}/images`, {
        method: 'POST',
        body: fd,
      });
    }

    navigateAfterSubmit(person, action);
  } catch (error) {
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};
```

- [ ] **Step 4: Add image upload UI to the form**

In the form JSX, add an image section after the Dates section and before the Actions. Find the closing `</div>` of the dates section and add:

```tsx
{/* Profile Image */}
<div className="border-t pt-6" style={{ borderColor: '#ede8e0' }}>
  <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>صورة البروفايل</label>
  <label className="btn-outline cursor-pointer">
    اختر صورة
    <input type="file" accept="image/*" onChange={handleProfileSelect} className="hidden" />
  </label>
  {profilePreview && (
    <div className="mt-3 flex items-center gap-4">
      <div className="w-20 h-20 rounded-xl overflow-hidden">
        <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
      </div>
      <button
        onClick={() => { setSelectedProfileImage(null); setProfilePreview(null); }}
        className="text-sm text-red-500"
      >
        إزالة
      </button>
    </div>
  )}
</div>
```

---

## Task 7: Viewer — Update Person Interface

**Files:**
- Modify: `viewer/lib/data.ts`

- [ ] **Step 1: Add additionalImages to Person interface**

In the `Person` interface, add:
```typescript
additionalImages: string | null;
```

Also update the `getPersonById` function to handle the additionalImages parsing. The function already returns the person directly — the parsing happens in the component.

---

## Task 8: Viewer — Person List Thumbnail Avatars

**Files:**
- Modify: `viewer/app/persons/page.tsx`

- [ ] **Step 1: Add thumbnail avatars in the table**

In the name column, replace the avatar circle with:
```tsx
{person.profileImage ? (
  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
    <img
      src={`/images/persons/${person.id}/profile.jpg`}
      alt=""
      className="w-full h-full object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        target.nextElementSibling?.classList.remove('hidden');
      }}
    />
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium hidden ${
      person.gender === 'MALE'
        ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]'
        : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
    }`}>
      {person.firstName.charAt(0)}
    </div>
  </div>
) : (
  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
    person.gender === 'MALE'
      ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]'
      : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
  }`}>
    {person.firstName.charAt(0)}
  </div>
)}
```

Wait, the viewer reads from `family.json` and the path in DB is already `images/persons/{id}/profile.jpg`, so we use `/{person.profileImage}` directly:

```tsx
{person.profileImage ? (
  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
    <img
      src={`/${person.profileImage}`}
      alt=""
      className="w-full h-full object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  </div>
) : (
  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
    person.gender === 'MALE'
      ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]'
      : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
  }`}>
    {person.firstName.charAt(0)}
  </div>
)}
```

---

## Task 9: Viewer — Person Detail Image Display

**Files:**
- Modify: `viewer/app/persons/[id]/page.tsx`

- [ ] **Step 1: Replace avatar with image in person header**

Find the avatar div (around lines 86-92):

Replace:
```tsx
<div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ${
  person.gender === 'MALE'
    ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]'
    : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
}`}>
  {person.firstName.charAt(0)}
</div>
```

With:
```tsx
{person.profileImage ? (
  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
    <img
      src={`/${person.profileImage}`}
      alt={`${person.firstName} ${person.lastName || ''}`}
      className="w-full h-full object-cover"
    />
  </div>
) : (
  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ${
    person.gender === 'MALE'
      ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]'
      : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
  }`}>
    {person.firstName.charAt(0)}
  </div>
)}
```

- [ ] **Step 2: Add thumbnail strip for additional images**

After the header card's closing `</div>`, add:
```tsx
{person.additionalImages && (() => {
  try {
    const imgs = JSON.parse(person.additionalImages);
    if (imgs && imgs.length > 0) {
      return (
        <div className="card p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {imgs.map((img: string, idx: number) => (
              <a
                key={idx}
                href={`/${img}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
              >
                <img src={`/${img}`} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      );
    }
  } catch {}
  return null;
})()}
```

---

## Task 10: Mobile — Image Display

**Files:**
- Modify: `Mobile/app/person/[id].tsx`

- [ ] **Step 1: Replace gender icon fallback with image**

Find the fallback section (around lines 122-126):
```tsx
} else {
  <View className="w-full h-full justify-center items-center bg-surface-light dark:bg-surface-dark">
    <Ionicons name={person.gender === MALE ? 'male' : 'female'} size={isLandscape ? 80 : 48} color={person.gender === MALE ? '#5b9' : '#bc6798'} />
  </View>
```

Replace with:
```tsx
} else if (person.profileImage) {
  <Image
    source={require(`../../assets/${person.profileImage}`)}
    className="w-full h-full"
    resizeMode="cover"
  />
} else {
  <View className="w-full h-full justify-center items-center bg-surface-light dark:bg-surface-dark">
    <Ionicons name={person.gender === MALE ? 'male' : 'female'} size={isLandscape ? 80 : 48} color={person.gender === MALE ? '#5b9' : '#bc6798'} />
  </View>
```

Also update the existing image sections to use the actual image when available. Replace the `allImages` logic at the top (around line 77):

```tsx
const allImages = [person.profileImage, ...(person.additionalImages || [])].filter(Boolean) as string[];
```

This already works since `additionalImages` is `string[]` in Mobile types.

- [ ] **Step 2: Add thumbnail strip for additional images**

Add this after the `mainInfo` section (before the `return` statement closes), inside the ScrollView, after the `{mainInfo}`:

Find the section where the image section and mainInfo render together. After the mainInfo closing tag and before the `<View className="px-4 pb-10">`, add:

```tsx
{/* Additional images strip */}
{person.additionalImages && person.additionalImages.length > 0 && (
  <View className="px-4 pb-4">
    <Text className="text-sm font-bold mb-2 text-text-secondary dark:text-text-dark-secondary">صور إضافية</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
      {person.additionalImages.map((img: string, idx: number) => (
        <TouchableOpacity
          key={idx}
          onPress={() => {/* lightbox */}}
          className="w-16 h-16 rounded-lg overflow-hidden"
        >
          <Image
            source={require(`../../assets/${img}`)}
            className="w-full h-full"
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
```

Add `ScrollView` import if not present (it may already be imported as part of the existing component).

---

## Task 11: Final Verification

- [ ] **Step 1: Test Web image upload**
Run `cd Web && npm run dev`, open a person detail, click edit, upload a profile image and additional images. Verify images appear in `Web/public/images/persons/{id}/`.

- [ ] **Step 2: Test export script**
Run `npm run db:sync` in the Web directory. Verify images are copied to `viewer/public/images/` and `Mobile/assets/images/`.

- [ ] **Step 3: Test viewer**
Run `cd viewer && npm run dev`, navigate to a person with images, verify they display correctly.

- [ ] **Step 4: Test mobile**
Run `cd Mobile && npm start`, navigate to a person with images, verify they display correctly.

---

## Build Notes

- `Web/public/images/persons/` should be added to git — it's the source of truth
- `viewer/public/images/` and `Mobile/assets/images/` are populated by `db:sync`
- If viewer/mobile don't rebuild after `db:sync`, restart their dev servers
- The viewer exports `additionalImages` as a string (JSON stringified array) from the Prisma field, so it needs `JSON.parse()` in the component before use
- Mobile's `additionalImages` is already `string[]` in the type definition, parsed at load time in `dataService.ts`