import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const viewerDataDir = path.join(__dirname, '..', '..', 'viewer', 'public', 'data');
  const mobileAssetsDir = path.join(__dirname, '..', '..', 'Mobile', 'assets');
  const sourceDbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  if (!fs.existsSync(viewerDataDir)) {
    fs.mkdirSync(viewerDataDir, { recursive: true });
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

  const data = { persons, marriages };
  
  const familyJsonPath = path.join(viewerDataDir, 'family.json');
  const familyJsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(familyJsonPath, familyJsonString);
  console.log(`Exported family.json to viewer`);

  if (!fs.existsSync(mobileAssetsDir)) {
    fs.mkdirSync(mobileAssetsDir, { recursive: true });
  }
  const mobileJsonPath = path.join(mobileAssetsDir, 'family.json');
  fs.writeFileSync(mobileJsonPath, familyJsonString);
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