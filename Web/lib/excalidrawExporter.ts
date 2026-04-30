import { hierarchy, tree as d3Tree } from 'd3-hierarchy';

export interface PersonNode {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  isAlive: boolean;
  birthDate?: Date | string | null;
  deathDate?: Date | string | null;
  fatherId: string | null;
  motherId: string | null;
  children?: PersonNode[];
  generation?: number;
}

export interface ExcalidrawExportOptions {
  layout: 'vertical' | 'horizontal' | 'radial';
  maxGenerations: number;
  useRectangles: boolean;
  includeDates: boolean;
  textAngle: number; // 0, 45, 90
  compactSpacing: boolean;
}

export class ExcalidrawExporter {
  static generateJson(rootPerson: PersonNode, allPersons: any[], options: ExcalidrawExportOptions) {
    // 1. Build hierarchy
    const rootNode = this.buildHierarchy(rootPerson, allPersons, 0, options.maxGenerations);
    
    // 2. Compute Layout
    const d3Hierarchy = hierarchy(rootNode);
    
    // Config dimensions based on options
    let nodeWidth = options.useRectangles ? 150 : 20;
    let nodeHeight = options.useRectangles ? 60 : 20;
    
    // If text is angled and we don't use rectangles, width can be very small
    if (options.textAngle !== 0 && !options.useRectangles) {
        nodeWidth = 20;
        nodeHeight = 20;
    }

    const dx = options.compactSpacing ? nodeHeight * 1.5 : nodeHeight * 2;
    const dy = options.compactSpacing ? nodeWidth * 1.2 : nodeWidth * 1.5;

    let elements: any[] = [];
    
    if (options.layout === 'radial') {
      const treeLayout = d3Tree<PersonNode>().size([2 * Math.PI, d3Hierarchy.height * dy])(d3Hierarchy);
      elements = this.drawRadialLayout(treeLayout, options);
    } else if (options.layout === 'horizontal') {
      const treeLayout = d3Tree<PersonNode>().nodeSize([dx, dy])(d3Hierarchy);
      elements = this.drawHorizontalLayout(treeLayout, options);
    } else { // vertical
      const treeLayout = d3Tree<PersonNode>().nodeSize([dy, dx])(d3Hierarchy);
      elements = this.drawVerticalLayout(treeLayout, options);
    }

    return {
      type: "excalidraw",
      version: 2,
      source: "https://family-tree-app",
      elements: elements,
      appState: {
        viewBackgroundColor: "#ffffff",
      }
    };
  }

  private static buildHierarchy(person: any, allPersons: any[], currentGen: number, maxGen: number): PersonNode {
    const node: PersonNode = { ...person, generation: currentGen };
    if (currentGen >= maxGen) {
      node.children = [];
      return node;
    }

    // find children
    const children = allPersons.filter(p => p.fatherId === person.id || p.motherId === person.id);
    
    // handle deduplication if needed? for now just simple tree
    // a real family tree might be a DAG, but d3-hierarchy requires a tree.
    // We only traverse down, so no loops from children.
    
    if (children.length > 0) {
      node.children = children.map(c => this.buildHierarchy(c, allPersons, currentGen + 1, maxGen));
    }
    return node;
  }

  private static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  private static getGenerationColor(generation: number) {
    const colors = ["#ffc9c9", "#b2f2bb", "#a5d8ff", "#ffec99", "#d0bfff", "#ffccf9", "#eebefa"];
    return colors[generation % colors.length];
  }

  private static createRectangle(x: number, y: number, width: number, height: number, bgColor: string, id: string) {
    return {
      type: "rectangle",
      version: 1,
      versionNonce: Math.random(),
      isDeleted: false,
      id,
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      angle: 0,
      x: x - width/2,
      y: y - height/2,
      strokeColor: "#000000",
      backgroundColor: bgColor,
      width,
      height,
      seed: Math.floor(Math.random() * 10000),
      groupIds: [],
      strokeSharpness: "round",
      boundElements: []
    };
  }

  private static createDot(x: number, y: number, bgColor: string, id: string) {
    return {
      type: "ellipse",
      version: 1,
      versionNonce: Math.random(),
      isDeleted: false,
      id,
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      angle: 0,
      x: x - 5,
      y: y - 5,
      strokeColor: "#000000",
      backgroundColor: bgColor,
      width: 10,
      height: 10,
      seed: Math.floor(Math.random() * 10000),
      groupIds: [],
      strokeSharpness: "round",
      boundElements: []
    };
  }

  private static createText(x: number, y: number, text: string, angle: number, id: string, width = 100, textAlign = "center") {
    return {
      type: "text",
      version: 1,
      versionNonce: Math.random(),
      isDeleted: false,
      id,
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      angle: (angle * Math.PI) / 180,
      x: x - width/2,
      y: y - 10, // approximate centering
      strokeColor: "#000000",
      backgroundColor: "transparent",
      width: width,
      height: 20,
      seed: Math.floor(Math.random() * 10000),
      groupIds: [],
      strokeSharpness: "sharp",
      boundElements: [],
      fontSize: 16,
      fontFamily: 1,
      text: text,
      baseline: 14,
      textAlign: textAlign,
      verticalAlign: "top"
    };
  }

  private static createArrow(startX: number, startY: number, endX: number, endY: number, startId: string, endId: string) {
    return {
      type: "arrow",
      version: 1,
      versionNonce: Math.random(),
      isDeleted: false,
      id: this.generateId(),
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      angle: 0,
      x: startX,
      y: startY,
      strokeColor: "#999999",
      backgroundColor: "transparent",
      width: Math.abs(endX - startX) || 1, // Excalidraw expects width/height > 0
      height: Math.abs(endY - startY) || 1,
      seed: Math.floor(Math.random() * 10000),
      groupIds: [],
      strokeSharpness: "round",
      boundElements: [],
      startBinding: { elementId: startId, focus: 0, gap: 5 },
      endBinding: { elementId: endId, focus: 0, gap: 5 },
      points: [[0, 0], [endX - startX, endY - startY]],
      lastCommittedPoint: null,
      startArrowhead: null,
      endArrowhead: null // no arrowhead for family tree looks cleaner
    };
  }

  private static drawVerticalLayout(root: d3.HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    const elements: any[] = [];
    const nodeIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    
    root.each(node => {
      nodeIds.set(node, this.generateId());
    });

    // Draw links first so they are under nodes
    root.links().forEach(link => {
      elements.push(this.createArrow(link.source.x, link.source.y, link.target.x, link.target.y, nodeIds.get(link.source)!, nodeIds.get(link.target)!));
    });

    root.each(node => {
      const id = nodeIds.get(node)!;
      const gen = node.data.generation || 0;
      const bgColor = this.getGenerationColor(gen);
      
      let displayName = node.data.firstName;
      if (options.includeDates && node.data.birthDate) {
        displayName += `\n(${new Date(node.data.birthDate).getFullYear()})`;
      }

      if (options.useRectangles) {
        elements.push(this.createRectangle(node.x, node.y, 120, 50, bgColor, id));
        elements.push(this.createText(node.x, node.y, displayName, options.textAngle, this.generateId(), 100));
      } else {
        elements.push(this.createDot(node.x, node.y, bgColor, id));
        elements.push(this.createText(node.x, node.y + 15, displayName, options.textAngle, this.generateId(), 100));
      }
    });

    return elements;
  }

  private static drawHorizontalLayout(root: d3.HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    const elements: any[] = [];
    const nodeIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    
    root.each(node => {
      nodeIds.set(node, this.generateId());
    });

    root.links().forEach(link => {
      // note: for horizontal, x and y are swapped
      elements.push(this.createArrow(link.source.y, link.source.x, link.target.y, link.target.x, nodeIds.get(link.source)!, nodeIds.get(link.target)!));
    });

    root.each(node => {
      const id = nodeIds.get(node)!;
      const gen = node.data.generation || 0;
      const bgColor = this.getGenerationColor(gen);
      
      let displayName = node.data.firstName;
      if (options.includeDates && node.data.birthDate) {
        displayName += `\n(${new Date(node.data.birthDate).getFullYear()})`;
      }

      if (options.useRectangles) {
        elements.push(this.createRectangle(node.y, node.x, 120, 50, bgColor, id));
        elements.push(this.createText(node.y, node.x, displayName, options.textAngle, this.generateId(), 100));
      } else {
        elements.push(this.createDot(node.y, node.x, bgColor, id));
        elements.push(this.createText(node.y, node.x + 15, displayName, options.textAngle, this.generateId(), 100, "left"));
      }
    });

    return elements;
  }

  private static drawRadialLayout(root: d3.HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    const elements: any[] = [];
    const nodeIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    
    root.each(node => {
      nodeIds.set(node, this.generateId());
    });

    const project = (x: number, y: number) => {
      const angle = x - Math.PI / 2;
      const radius = y;
      return [radius * Math.cos(angle), radius * Math.sin(angle)];
    };

    root.links().forEach(link => {
      const [sx, sy] = project(link.source.x, link.source.y);
      const [tx, ty] = project(link.target.x, link.target.y);
      elements.push(this.createArrow(sx, sy, tx, ty, nodeIds.get(link.source)!, nodeIds.get(link.target)!));
    });

    root.each(node => {
      const [x, y] = project(node.x, node.y);
      const id = nodeIds.get(node)!;
      const gen = node.data.generation || 0;
      const bgColor = this.getGenerationColor(gen);
      
      let displayName = node.data.firstName;
      if (options.includeDates && node.data.birthDate) {
        displayName += `\n(${new Date(node.data.birthDate).getFullYear()})`;
      }

      // calculate angle for text so it reads outwards
      let textAngle = (node.x * 180 / Math.PI) - 90;
      // flip text if on the left side to be readable
      let textAlign = "left";
      if (textAngle > 90 || textAngle < -90) {
        textAngle += 180;
        textAlign = "right";
      }
      
      // if user explicitly sets textAngle we can override or just add
      if (options.textAngle !== 0) {
         textAngle = options.textAngle; // absolute override if wanted
         textAlign = "center";
      }

      if (options.useRectangles) {
        elements.push(this.createRectangle(x, y, 100, 40, bgColor, id));
        elements.push(this.createText(x, y, displayName, textAngle, this.generateId(), 100, textAlign));
      } else {
        elements.push(this.createDot(x, y, bgColor, id));
        elements.push(this.createText(x, y, displayName, textAngle, this.generateId(), 100, textAlign));
      }
    });

    return elements;
  }
}
