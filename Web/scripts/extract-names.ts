import * as fs from 'fs';

const canvasPath = 'D:/Projects/Manafikhi-Family-Tree/Mobile/assets/manafikhi-obsidian/tree.canvas';
const data = JSON.parse(fs.readFileSync(canvasPath, 'utf-8'));

const names = new Set<string>();
const nodes: any[] = data.nodes || [];

for (const node of nodes) {
  if (node.type === 'text' && node.text) {
    const name = node.text.replace(/\n.*$/, '').trim();
    if (name) {
      names.add(name);
    }
  }
}

const sorted = Array.from(names).sort();
fs.writeFileSync('D:/Projects/Manafikhi-Family-Tree/web/scripts/extracted-names.txt', sorted.join('\n'), 'utf-8');
console.log(`Extracted ${sorted.length} unique names`);