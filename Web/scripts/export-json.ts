import { PrismaClient } from '@prisma/client';
import { existsSync, cp, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { mkdir } from 'fs/promises';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const viewerDataDir = path.join(__dirname, '..', '..', 'viewer', 'public', 'data');
  const mobileAssetsDir = path.join(__dirname, '..', '..', 'Mobile', 'assets');
  const sourceDbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  if (!existsSync(viewerDataDir)) {
    mkdirSync(viewerDataDir, { recursive: true });
  }

  console.log('Fetching data from database...');
  
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

  console.log(`Found ${persons.length} persons and ${marriages.length} marriages`);

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
  } else {
    console.log('No images to copy');
  }

  const data = { persons, marriages };
  
  const familyJsonPath = path.join(viewerDataDir, 'family.json');
  const familyJsonString = JSON.stringify(data, null, 2);
  writeFileSync(familyJsonPath, familyJsonString);
  console.log(`Exported family.json to viewer`);

  if (!existsSync(mobileAssetsDir)) {
    mkdirSync(mobileAssetsDir, { recursive: true });
  }
  const mobileJsonPath = path.join(mobileAssetsDir, 'family.json');
  writeFileSync(mobileJsonPath, familyJsonString);
  console.log(`Exported family.json to Mobile/assets`);

  console.log('Sync complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });