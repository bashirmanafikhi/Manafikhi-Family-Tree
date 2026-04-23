import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface CanvasNode {
  id: string;
  type: string;
  text?: string;
  color?: string;
  file?: string;
  label?: string;
}

interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  toEnd?: string;
  fromSide?: string;
  toSide?: string;
}

interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

function loadCanvas(): CanvasData {
  const content = fs.readFileSync(
    'D:/Projects/Manafikhi-Family-Tree/Mobile/assets/manafikhi-obsidian/tree.canvas',
    'utf-8',
  );
  return JSON.parse(content);
}

function loadGenderMap(): Map<string, 'm' | 'f'> {
  const content = fs.readFileSync(
    'D:/Projects/Manafikhi-Family-Tree/Web/scripts/gender-map.txt',
    'utf-8',
  );
  const map = new Map<string, 'm' | 'f'>();
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\r/g, '').trim();
    if (!line) continue;
    const lastComma = line.lastIndexOf(',');
    if (lastComma === -1) continue;
    const name = line.substring(0, lastComma).trim();
    const gender = line.substring(lastComma + 1).trim() as 'm' | 'f';
    if (name && (gender === 'm' || gender === 'f')) {
      map.set(name, gender);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Gender resolution
// ---------------------------------------------------------------------------

function resolveGender(
  rawText: string,
  genderMap: Map<string, 'm' | 'f'>,
): 'MALE' | 'FEMALE' {
  // Take the first line only and trim
  const text = rawText.split('\n')[0].trim();

  // 1. Exact match (handles numbered names like "1 عبد الرحمن")
  if (genderMap.has(text)) {
    return genderMap.get(text) === 'm' ? 'MALE' : 'FEMALE';
  }

  // 2. Strip leading ordinal/number prefix  (e.g. "1 ", "3. ", "12. ")
  const stripped = text.replace(/^\d+\.?\s+/, '').trim();
  if (stripped !== text && genderMap.has(stripped)) {
    return genderMap.get(stripped) === 'm' ? 'MALE' : 'FEMALE';
  }

  // 3. Arabic morphological fallback  (feminine endings)
  if (/[ةىاء]$/.test(text)) {
    return 'FEMALE';
  }

  return 'MALE'; // safe default
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // ── 1. Wipe existing data ────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await prisma.marriage.deleteMany();
  await prisma.person.deleteMany();
  console.log('✅ Database cleared\n');

  // ── 2. Load source files ─────────────────────────────────────────────────
  const genderMap = loadGenderMap();
  const canvas = loadCanvas();

  const textNodes = canvas.nodes.filter((n) => n.type === 'text' && n.text?.trim());
  const edges: CanvasEdge[] = canvas.edges ?? [];

  console.log(`📊 Gender map entries : ${genderMap.size}`);
  console.log(`📊 Person nodes       : ${textNodes.length}`);
  console.log(`📊 Edges              : ${edges.length}`);
  console.log(`📊 Marriage edges     : ${edges.filter((e) => e.toEnd === 'none').length}\n`);

  // ── 3. Create persons ────────────────────────────────────────────────────
  // canvasNodeId -> prisma person id
  const idMap = new Map<string, string>();
  // canvasNodeId -> gender (for fast parent lookups later)
  const genderCache = new Map<string, 'MALE' | 'FEMALE'>();

  console.log('👥 Creating persons...');
  let noGenderMatch = 0;

  for (const node of textNodes) {
    const rawText = node.text!.trim();
    const firstName = rawText.split('\n')[0].trim();
    if (!firstName) continue;

    const gender = resolveGender(rawText, genderMap);

    // Warn if we fell back to heuristic/default
    if (!genderMap.has(firstName) && !genderMap.has(firstName.replace(/^\d+\.?\s+/, '').trim())) {
      noGenderMatch++;
      console.log(`  ⚠️  No gender map match for: "${firstName}" → defaulted to ${gender}`);
    }

    const person = await prisma.person.create({
      data: {
        firstName,
        gender,
        canvasId: node.id,
        isAlive: true,
      },
    });

    idMap.set(node.id, person.id);
    genderCache.set(node.id, gender);
  }

  console.log(`\n✅ Created ${idMap.size} persons`);
  if (noGenderMatch > 0) {
    console.log(`   ⚠️  ${noGenderMatch} persons had no exact gender-map match\n`);
  }

  // ── 4. Marriages (toEnd === "none") ───────────────────────────────────────
  const marriageEdges = edges.filter((e) => e.toEnd === 'none');
  console.log(`\n💍 Processing ${marriageEdges.length} marriage edges...`);
  let marriagesCreated = 0;

  for (const edge of marriageEdges) {
    const p1Id = idMap.get(edge.fromNode);
    const p2Id = idMap.get(edge.toNode);
    if (!p1Id || !p2Id) {
      console.log(`  ⚠️  Marriage skipped – node not found (${edge.fromNode} ↔ ${edge.toNode})`);
      continue;
    }
    try {
      await prisma.marriage.create({
        data: { person1Id: p1Id, person2Id: p2Id, isCurrent: true },
      });
      marriagesCreated++;
    } catch (e: any) {
      // Unique constraint – try reversed order
      try {
        await prisma.marriage.create({
          data: { person1Id: p2Id, person2Id: p1Id, isCurrent: true },
        });
        marriagesCreated++;
      } catch (e2: any) {
        if (e2.code === 'P2002') {
          console.log(`  ⚠️  Duplicate marriage skipped`);
        } else {
          console.log(`  ❌ Marriage error: ${e2.message}`);
        }
      }
    }
  }

  console.log(`✅ Created ${marriagesCreated} marriages`);

  // ── 5. Parent-child relationships ────────────────────────────────────────
  const parentChildEdges = edges.filter((e) => e.toEnd !== 'none');
  console.log(`\n👨‍👩‍👧 Processing ${parentChildEdges.length} parent-child edges...`);
  let parentChildCount = 0;
  let skipped = 0;

  for (const edge of parentChildEdges) {
    const parentPrismaId = idMap.get(edge.fromNode);
    const childPrismaId = idMap.get(edge.toNode);
    if (!parentPrismaId || !childPrismaId) {
      skipped++;
      continue;
    }

    const parentGender = genderCache.get(edge.fromNode);
    if (!parentGender) {
      skipped++;
      continue;
    }

    try {
      if (parentGender === 'MALE') {
        await prisma.person.update({
          where: { id: childPrismaId },
          data: { fatherId: parentPrismaId },
        });
      } else {
        await prisma.person.update({
          where: { id: childPrismaId },
          data: { motherId: parentPrismaId },
        });
      }
      parentChildCount++;
    } catch (e: any) {
      console.log(`  ❌ Parent-child error: ${e.message}`);
    }
  }

  console.log(`✅ Set ${parentChildCount} parent-child relationships`);
  if (skipped > 0) {
    console.log(`   ⚠️  ${skipped} edges skipped (group nodes or missing persons)`);
  }

  // ── 6. Summary ───────────────────────────────────────────────────────────
  console.log('\n🎉 Migration complete!');
  console.log(`   Persons         : ${idMap.size}`);
  console.log(`   Marriages       : ${marriagesCreated} (expected 37)`);
  console.log(`   Parent-child    : ${parentChildCount}`);

  if (marriagesCreated !== 37) {
    console.log(`\n   ⚠️  WARNING: Expected 37 marriages but got ${marriagesCreated}!`);
    console.log(`      Check for marriage edges where one or both nodes are group/missing.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });