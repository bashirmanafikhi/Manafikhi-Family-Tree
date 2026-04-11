import { CanvasData, CanvasNode, CanvasEdge } from '../types';

let canvasData: CanvasData | null = null;

export async function loadCanvasDataAsync(): Promise<CanvasData | null> {
  try {
    const response = await fetch('./assets/manafikhi-obsidian/tree.canvas');
    const text = await response.text();
    canvasData = JSON.parse(text);
    return canvasData;
  } catch (e) {
    console.error('Failed to load canvas:', e);
    return null;
  }
}

export function getCanvasData(): CanvasData | null {
  return canvasData;
}

export function loadCanvasData(): CanvasData | null {
  return canvasData;
}

export function buildNodeMap(nodes: CanvasNode[]): Map<string, CanvasNode> {
  const map = new Map<string, CanvasNode>();
  nodes.forEach(node => map.set(node.id, node));
  return map;
}

export function getChildNodes(edges: CanvasEdge[], nodeId: string): string[] {
  return edges.filter(edge => edge.fromNode === nodeId).map(edge => edge.toNode);
}

export function getParentNodes(edges: CanvasEdge[], nodeId: string): string[] {
  return edges.filter(edge => edge.toNode === nodeId).map(edge => edge.fromNode);
}

export function getTextNodes(nodes: CanvasNode[]): CanvasNode[] {
  return nodes.filter(node => node.type === 'text');
}

export function getGenerationLevel(y: number): number {
  const Y_BANDS = [-360, -90, 280, 560, 840, 1115];
  for (let i = Y_BANDS.length - 1; i >= 0; i--) {
    if (y >= Y_BANDS[i]) return i;
  }
  return 0;
}