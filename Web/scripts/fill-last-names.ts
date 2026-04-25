import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fillLastNames() {
  console.log('Starting last name propagation...');

  // Fetch all persons to process in memory
  const persons = await prisma.person.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fatherId: true,
      gender: true,
    },
  });

  const personMap = new Map(persons.map((p) => [p.id, { ...p }]));
  let changedCount = 0;
  let iteration = 0;
  let totalChanges = 0;

  while (true) {
    iteration++;
    changedCount = 0;
    console.log(`Iteration ${iteration}...`);

    for (const person of personMap.values()) {
      if (person.fatherId) {
        const father = personMap.get(person.fatherId);
        if (father && father.lastName && person.lastName !== father.lastName) {
          person.lastName = father.lastName;
          changedCount++;
        }
      }
    }

    totalChanges += changedCount;
    if (changedCount === 0) break;
    console.log(`  Updated ${changedCount} last names in memory.`);
  }

  if (totalChanges === 0) {
    console.log('No updates needed.');
    return;
  }

  console.log(`Applying ${totalChanges} updates to the database...`);

  // Batch updates in SQLite can be tricky with Prisma, so we'll do them sequentially or in small chunks
  // For safety and simplicity in a script, we'll iterate and update
  let appliedCount = 0;
  for (const person of personMap.values()) {
    const original = persons.find((p) => p.id === person.id);
    if (original && original.lastName !== person.lastName) {
      await prisma.person.update({
        where: { id: person.id },
        data: { lastName: person.lastName },
      });
      appliedCount++;
      if (appliedCount % 10 === 0) {
        console.log(`  Progress: ${appliedCount}/${totalChanges}`);
      }
    }
  }

  console.log(`Successfully updated ${appliedCount} persons.`);
}

fillLastNames()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
