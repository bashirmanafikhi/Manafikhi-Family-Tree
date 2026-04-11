export interface CanvasNode {
  id: string;
  type: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  file?: string;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide: string;
  toNode: string;
  toSide: string;
  color?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface PersonMeta {
  name: string;
  birth_date?: string;
  death_date?: string;
  gender?: 'male' | 'female';
  images?: string[];
  occupation?: string;
  nickname?: string;
}

export interface Person {
  id: string;
  folderName: string;
  fileName: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  gender?: 'male' | 'female';
  images?: string[];
  occupation?: string;
  nickname?: string;
  bio: string;
  rawMeta: PersonMeta;
}

export interface TreeNode {
  id: string;
  personId?: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  children: TreeNode[];
  parents: string[];
  isTextNode: boolean;
}

export interface FamilyTree {
  nodes: Map<string, TreeNode>;
  persons: Map<string, Person>;
}