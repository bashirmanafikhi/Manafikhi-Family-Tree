import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface CanvasNode { id: string; type: string; text?: string; }
interface CanvasEdge { id: string; fromNode: string; toNode: string; toEnd?: string; }
interface CanvasData { nodes: CanvasNode[]; edges: CanvasEdge[]; }
interface GenderMap { [name: string]: 'm' | 'f'; }

function loadGenderMap(): GenderMap {
  const content = fs.readFileSync('D:/Projects/Manafikhi-Family-Tree/web/scripts/gender-map.txt', 'utf-8');
  const map: GenderMap = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lastComma = trimmed.lastIndexOf(',');
    if (lastComma === -1) continue;
    const name = trimmed.substring(0, lastComma).trim();
    const gender = trimmed.substring(lastComma + 1).trim() as 'm' | 'f';
    if (name && (gender === 'm' || gender === 'f')) map[name] = gender;
  }
  return map;
}

function guessGender(name: string): 'm' | 'f' {
  if (/ة$/.test(name) || /ى$/.test(name)) return 'f';
  return 'm';
}

async function main() {
  const genderMap = loadGenderMap();
  const canvas: CanvasData = JSON.parse(
    fs.readFileSync('D:/Projects/Manafikhi-Family-Tree/Mobile/assets/manafikhi-obsidian/tree.canvas', 'utf-8')
  );

  const textNodes = canvas.nodes.filter((n) => n.type === 'text');

  let updated = 0;
  let skipped = 0;

  for (const edge of canvas.edges) {
    if (edge.toEnd === 'none') continue;

    const fromNode = textNodes.find((n) => n.id === edge.fromNode);
    const toNode = textNodes.find((n) => n.id === edge.toNode);
    if (!fromNode?.text || !toNode?.text) continue;

    const parentName = fromNode.text.replace(/\n.*$/, '').trim();
    const childName = toNode.text.replace(/\n.*$/, '').trim();
    const parentGender = genderMap[parentName] || guessGender(parentName);

    try {
      const child = await prisma.person.findFirst({
        where: { firstName: childName, gender: parentGender === 'm' ? undefined : undefined },
        orderBy: { createdAt: 'asc' },
        skip: 0,
      });

      if (!child) {
        skipped++;
        continue;
      }

      if (parentGender === 'm') {
        await prisma.person.update({
          where: { id: child.id },
          data: { fatherId: edge.fromNode },
        });
      } else {
        await prisma.person.update({
          where: { id: child.id },
          data: { motherId: edge.fromNode },
        });
      }
      updated++;
    } catch (e: any) {
      skipped++;
    }
  }

  const withFather = await prisma.person.count({ where: { fatherId: { not: null } } });
  const withMother = await prisma.person.count({ where: { motherId: { not: null } } });
  console.log(`Done! Updated: ${updated}, Skipped: ${skipped}`);
  console.log(`With fatherId: ${withFather}, With motherId: ${withMother}`);
}

main().finally(() => prisma.$disconnect());