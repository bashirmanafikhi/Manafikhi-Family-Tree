import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const IMAGE_BASE = path.join(process.cwd(), 'public', 'images', 'persons');

function personImageDir(personId: string): string {
  return path.join(IMAGE_BASE, personId);
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

  if (profileFile && profileFile.size > 0) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(profileFile.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (profileFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }
    if (person.profileImage) {
      const oldPath = path.join(process.cwd(), 'public', person.profileImage);
      if (existsSync(oldPath)) {
        await rm(oldPath);
      }
    }

    const buffer = Buffer.from(await profileFile.arrayBuffer());
    await writeFile(path.join(dir, 'profile.jpg'), buffer);
    newProfileImage = portablePath(personId, 'profile.jpg');
  }

  let newGallery = [...existingGallery];
  if (additionalFiles.length > 0) {
    const startIndex = existingGallery.length;
    for (let i = 0; i < additionalFiles.length; i++) {
      const file = additionalFiles[i];
      if (!file || file.size === 0) continue;
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
      }
      const filename = `${startIndex + i}.jpg`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await mkdir(path.join(dir, 'gallery'), { recursive: true });
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
  const type = searchParams.get('type');
  const index = searchParams.get('index');

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