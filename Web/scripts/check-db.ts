const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.person.count(),
  p.marriage.count(),
  p.person.count({ where: { fatherId: { not: null } } }),
  p.person.count({ where: { motherId: { not: null } } })
]).then(([persons, marriages, withFathers, withMothers]) => {
  console.log(`Persons: ${persons}, Marriages: ${marriages}, With fathers: ${withFathers}, With mothers: ${withMothers}`);
  process.exit(0);
});