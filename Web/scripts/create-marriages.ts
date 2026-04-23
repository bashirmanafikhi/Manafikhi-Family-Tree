import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  toEnd?: string;
}

async function main() {
  const canvasPath = path.join('..', 'Mobile', 'assets', 'manafikhi-obsidian', 'tree.canvas');
  const canvasContent = fs.readFileSync(canvasPath, 'utf-8');
  const canvas = JSON.parse(canvasContent);

  const edges = canvas.edges as CanvasEdge[];
  const marriageEdges = edges.filter(e => e.toEnd === 'none');
  console.log(`Found ${marriageEdges.length} marriage edges in canvas`);

  const persons = await prisma.person.findMany({
    select: { id: true, canvasId: true }
  });
  
  const canvasToDb = new Map<string, string>();
  for (const p of persons) {
    if (p.canvasId) canvasToDb.set(p.canvasId, p.id);
  }
  console.log(`Mapped ${canvasToDb.size} canvas IDs to DB IDs`);

  let created = 0;
  let skipped = 0;

  for (const edge of marriageEdges) {
    const person1Id = canvasToDb.get(edge.fromNode);
    const person2Id = canvasToDb.get(edge.toNode);

    if (!person1Id || !person2Id) {
      skipped++;
      continue;
    }

    try {
      await prisma.marriage.create({
        data: {
          person1Id,
          person2Id,
          isCurrent: true
        }
      });
      created++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        skipped++;
      } else {
        throw e;
      }
    }
  }

  console.log(`Created ${created} marriages, skipped ${skipped}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });