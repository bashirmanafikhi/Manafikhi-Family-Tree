import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`UPDATE Person SET gender = 'MALE' WHERE gender = 'm'`);
  await prisma.$executeRawUnsafe(`UPDATE Person SET gender = 'FEMALE' WHERE gender = 'f'`);
  console.log('Done!');
  await prisma.$disconnect();
}
main();