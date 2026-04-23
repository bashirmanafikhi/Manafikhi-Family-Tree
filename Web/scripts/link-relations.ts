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
  const nodeNameMap = new Map<string, string>();
  for (const node of textNodes) {
    if (!node.text) continue;
    const name = node.text.replace(/\n.*$/, '').trim();
    nodeNameMap.set(node.id, name);
  }

  const allPersons = await prisma.person.findMany({ where: { canvasId: { not: null } }, select: { id: true, canvasId: true } });
  const dbMap = new Map<string, string>();
  for (const p of allPersons) {
    if (p.canvasId) dbMap.set(p.canvasId, p.id);
  }

  const fatherUpdates: string[] = [];
  const motherUpdates: string[] = [];

  for (const edge of canvas.edges) {
    if (edge.toEnd === 'none') continue;

    const fromName = nodeNameMap.get(edge.fromNode);
    if (!fromName) continue;

    const parentGender = genderMap[fromName] || guessGender(fromName);
    const parentDbId = dbMap.get(edge.fromNode);
    const childDbId = dbMap.get(edge.toNode);
    if (!parentDbId || !childDbId) continue;

    if (parentGender === 'm') {
      fatherUpdates.push(`WHEN id='${childDbId}' THEN '${parentDbId}'`);
    } else {
      motherUpdates.push(`WHEN id='${childDbId}' THEN '${parentDbId}'`);
    }
  }

  console.log(`Father updates: ${fatherUpdates.length}, Mother updates: ${motherUpdates.length}`);

  if (fatherUpdates.length > 0) {
    const fatherCase = fatherUpdates.join(' ');
    await prisma.$executeRawUnsafe(`
      UPDATE Person SET fatherId = CASE ${fatherCase} ELSE fatherId END WHERE id IN (
        SELECT id FROM Person WHERE id IN (
          ${fatherUpdates.map(u => u.match(/WHEN id='(.+?)' THEN/)?.[1]).filter(Boolean).map(id => `'${id}'`).join(',')}
        )
      )
    `);
  }

  if (motherUpdates.length > 0) {
    const motherCase = motherUpdates.join(' ');
    await prisma.$executeRawUnsafe(`
      UPDATE Person SET motherId = CASE ${motherCase} ELSE motherId END WHERE id IN (
        SELECT id FROM Person WHERE id IN (
          ${motherUpdates.map(u => u.match(/WHEN id='(.+?)' THEN/)?.[1]).filter(Boolean).map(id => `'${id}'`).join(',')}
        )
      )
    `);
  }

  const withFather = await prisma.person.count({ where: { fatherId: { not: null } } });
  const withMother = await prisma.person.count({ where: { motherId: { not: null } } });
  console.log(`Done! With fatherId: ${withFather}, With motherId: ${withMother}`);
}

main().finally(() => prisma.$disconnect());