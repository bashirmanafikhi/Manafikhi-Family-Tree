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
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineSharpness: 'round' | 'sharp';
  direction: 'ltr' | 'rtl';
}

export class ExcalidrawExporter {
  static generateJson(rootPerson: PersonNode, allPersons: any[], options: ExcalidrawExportOptions) {
    // 1. Build hierarchy
    const rootNode = this.buildHierarchy(rootPerson, allPersons, 0, options.maxGenerations);
    
    // 2. Compute Layout
    const d3Hierarchy = hierarchy(rootNode);
    
    let elements: any[] = [];
    
    if (options.layout === 'radial') {
      const radiusStep = options.compactSpacing ? 120 : 180;
      // Variable Radius Strategy: Exponential increase
      const treeLayout = d3Tree<PersonNode>()
        .size([2 * Math.PI, 1]) // We will scale radius manually
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)(d3Hierarchy);
      
      // Calculate depth manually and apply expanding radius
      treeLayout.each(d => {
        // Depth increases distance exponentially
        d.y = d.depth * radiusStep * Math.pow(1.1, d.depth);
      });
      elements = this.drawRadialLayout(treeLayout, options);
    } else if (options.layout === 'horizontal') {
      const dx = options.compactSpacing ? 40 : 60;
      const dy = options.compactSpacing ? 200 : 250;
      const treeLayout = d3Tree<PersonNode>().nodeSize([dx, dy])(d3Hierarchy);
      elements = this.drawHorizontalLayout(treeLayout, options);
    } else { // vertical
      const dx = options.compactSpacing ? 150 : 200;
      const dy = options.compactSpacing ? 80 : 120;
      const treeLayout = d3Tree<PersonNode>().nodeSize([dx, dy])(d3Hierarchy);
      elements = this.drawVerticalLayout(treeLayout, options);
    }

    return {
      type: "excalidraw",
      version: 2,
      source: "https://family-tree-app",
      elements: elements,
      appState: {
        viewBackgroundColor: "#f8f9fa",
      }
    };
  }

  private static buildHierarchy(person: any, allPersons: any[], currentGen: number, maxGen: number): PersonNode {
    const node: PersonNode = { ...person, generation: currentGen };
    if (currentGen >= maxGen) {
      node.children = [];
      return node;
    }

    const children = allPersons.filter(p => p.fatherId === person.id || p.motherId === person.id);
    
    if (children.length > 0) {
      node.children = children.map(c => this.buildHierarchy(c, allPersons, currentGen + 1, maxGen));
    }
    return node;
  }

  private static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  private static getGenerationColor(generation: number) {
    // Professional, faded pastel palette that is colorful but doesn't distract from text
    const colors = ["#e3f2fd", "#f3e5f5", "#e8f5e9", "#fff3e0", "#ffebee", "#e0f7fa", "#fff8e1"];
    return colors[generation % colors.length];
  }

  private static createRectangle(x: number, y: number, width: number, height: number, bgColor: string, id: string, groupIds: string[] = [], boundElements: any[] = []) {
    return {
      type: "rectangle",
      version: 1,
      versionNonce: Math.floor(Math.random() * 2147483647),
      isDeleted: false,
      id,
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      angle: 0,
      x: x - width / 2,
      y: y - height / 2,
      strokeColor: "#343a40",
      backgroundColor: bgColor,
      width,
      height,
      seed: Math.floor(Math.random() * 2147483647),
      groupIds,
      strokeSharpness: "round",
      boundElements
    };
  }

  private static createDot(x: number, y: number, bgColor: string, id: string, groupIds: string[] = [], boundElements: any[] = []) {
    return {
      type: "ellipse",
      version: 1,
      versionNonce: Math.floor(Math.random() * 2147483647),
      isDeleted: false,
      id,
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      angle: 0,
      x: x - 4,
      y: y - 4,
      strokeColor: "#495057",
      backgroundColor: bgColor,
      width: 8,
      height: 8,
      seed: Math.floor(Math.random() * 2147483647),
      groupIds,
      strokeSharpness: "round",
      boundElements
    };
  }

  private static createText(x: number, y: number, text: string, angle: number, id: string, width: number, textAlign = "center", groupIds: string[] = [], containerId: string | null = null) {
    return {
      type: "text",
      version: 1,
      versionNonce: Math.floor(Math.random() * 2147483647),
      isDeleted: false,
      id,
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      angle: (angle * Math.PI) / 180,
      x: x - width / 2,
      y: y,
      strokeColor: "#212529",
      backgroundColor: "transparent",
      width: width,
      height: 20,
      seed: Math.floor(Math.random() * 2147483647),
      groupIds,
      strokeSharpness: "sharp",
      boundElements: [],
      fontSize: 14,
      fontFamily: 1,
      text: text,
      baseline: 12,
      textAlign: textAlign,
      verticalAlign: containerId ? "middle" : "top",
      containerId: containerId
    };
  }

  private static createArrow(id: string, points: [number, number][], startId: string, endId: string, groupIds: string[] = [], options: ExcalidrawExportOptions) {
    const startX = points[0][0];
    const startY = points[0][1];
    const relativePoints = points.map(p => [p[0] - startX, p[1] - startY]);
    const minX = Math.min(...relativePoints.map(p => p[0]));
    const maxX = Math.max(...relativePoints.map(p => p[0]));
    const minY = Math.min(...relativePoints.map(p => p[1]));
    const maxY = Math.max(...relativePoints.map(p => p[1]));

    return {
      type: "arrow",
      version: 1,
      versionNonce: Math.floor(Math.random() * 2147483647),
      isDeleted: false,
      id: id,
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: options.lineStyle || "solid",
      roughness: 0,
      opacity: 100,
      angle: 0,
      x: startX,
      y: startY,
      strokeColor: "#adb5bd",
      backgroundColor: "transparent",
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      seed: Math.floor(Math.random() * 2147483647),
      groupIds,
      strokeSharpness: options.lineSharpness || "round",
      boundElements: [],
      startBinding: { elementId: startId, focus: 0, gap: 5 },
      endBinding: { elementId: endId, focus: 0, gap: 5 },
      points: relativePoints,
      lastCommittedPoint: null,
      startArrowhead: null,
      endArrowhead: null
    };
  }

  private static getNodeDisplayName(node: d3.HierarchyPointNode<PersonNode>, includeDates: boolean) {
    let displayName = node.data.firstName;
    if (includeDates && node.data.birthDate) {
      displayName += `\n(${new Date(node.data.birthDate).getFullYear()})`;
    }
    return displayName;
  }

  private static getNodeWidth(text: string) {
    // Dynamic Width Calculation based on text length
    const longestLine = text.split('\n').reduce((a, b) => a.length > b.length ? a : b, "");
    return Math.max(80, longestLine.length * 9);
  }

  private static drawVerticalLayout(root: d3.HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    const elements: any[] = [];
    const nodeIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    const familyGroupIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    const boundElementsMap = new Map<string, { id: string, type: string }[]>();

    const addBoundElement = (nodeId: string, arrowId: string) => {
      if (!boundElementsMap.has(nodeId)) boundElementsMap.set(nodeId, []);
      boundElementsMap.get(nodeId)!.push({ id: arrowId, type: "arrow" });
    };
    
    root.each(node => {
      nodeIds.set(node, this.generateId());
      familyGroupIds.set(node, this.generateId()); // Nuclear family group (parent + children + lines)
    });

    const projectX = (x: number) => options.direction === 'rtl' ? -x : x;
    const projectY = (y: number) => y;

    root.links().forEach(link => {
      const sourceId = nodeIds.get(link.source)!;
      const targetId = nodeIds.get(link.target)!;
      const groupId = familyGroupIds.get(link.source)!;
      const arrowId = this.generateId();
      
      const sx = projectX(link.source.x), sy = projectY(link.source.y);
      const tx = projectX(link.target.x), ty = projectY(link.target.y);
      // Smooth Bezier / Step-after
      const midY = (sy + ty) / 2;
      const points: [number, number][] = [[sx, sy], [sx, midY], [tx, midY], [tx, ty]];
      
      elements.push(this.createArrow(arrowId, points, sourceId, targetId, [groupId], options));
      addBoundElement(sourceId, arrowId);
      addBoundElement(targetId, arrowId);
    });

    root.each(node => {
      const id = nodeIds.get(node)!;
      const gen = node.data.generation || 0;
      const bgColor = this.getGenerationColor(gen);
      
      const displayName = this.getNodeDisplayName(node, options.includeDates);
      const nodeWidth = this.getNodeWidth(displayName);
      const boundElements = boundElementsMap.get(id) || [];
      
      const nx = projectX(node.x);
      const ny = projectY(node.y);
      
      // Node belongs to its parent's family group and its own family group
      const groups = [familyGroupIds.get(node)!];
      if (node.parent) groups.push(familyGroupIds.get(node.parent)!);

      if (options.useRectangles) {
        const textId = this.generateId();
        const rectBoundElements = [...boundElements, { id: textId, type: "text" }];
        elements.push(this.createRectangle(nx, ny, nodeWidth, 45, bgColor, id, groups, rectBoundElements));
        elements.push(this.createText(nx, ny, displayName, options.textAngle, textId, nodeWidth, "center", groups, id));
      } else {
        const nodeGroupId = this.generateId();
        const combinedGroups = [nodeGroupId, ...groups];
        elements.push(this.createDot(nx, ny, bgColor, id, combinedGroups, boundElements));
        elements.push(this.createText(nx, ny + 10, displayName, options.textAngle, this.generateId(), nodeWidth, "center", combinedGroups));
      }
    });

    return elements;
  }

  private static drawHorizontalLayout(root: d3.HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    const elements: any[] = [];
    const nodeIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    const familyGroupIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    const boundElementsMap = new Map<string, { id: string, type: string }[]>();

    const addBoundElement = (nodeId: string, arrowId: string) => {
      if (!boundElementsMap.has(nodeId)) boundElementsMap.set(nodeId, []);
      boundElementsMap.get(nodeId)!.push({ id: arrowId, type: "arrow" });
    };
    
    root.each(node => {
      nodeIds.set(node, this.generateId());
      familyGroupIds.set(node, this.generateId());
    });

    const projectX = (y: number) => options.direction === 'rtl' ? -y : y;
    const projectY = (x: number) => x;

    root.links().forEach(link => {
      const sourceId = nodeIds.get(link.source)!;
      const targetId = nodeIds.get(link.target)!;
      const groupId = familyGroupIds.get(link.source)!;
      const arrowId = this.generateId();
      
      // note: for horizontal, x and y are swapped
      const sx = projectX(link.source.y), sy = projectY(link.source.x);
      const tx = projectX(link.target.y), ty = projectY(link.target.x);
      const midX = (sx + tx) / 2;
      const points: [number, number][] = [[sx, sy], [midX, sy], [midX, ty], [tx, ty]];
      
      elements.push(this.createArrow(arrowId, points, sourceId, targetId, [groupId], options));
      addBoundElement(sourceId, arrowId);
      addBoundElement(targetId, arrowId);
    });

    root.each(node => {
      const id = nodeIds.get(node)!;
      const gen = node.data.generation || 0;
      const bgColor = this.getGenerationColor(gen);
      
      const displayName = this.getNodeDisplayName(node, options.includeDates);
      const nodeWidth = this.getNodeWidth(displayName);
      const boundElements = boundElementsMap.get(id) || [];

      const nx = projectX(node.y);
      const ny = projectY(node.x);

      const groups = [familyGroupIds.get(node)!];
      if (node.parent) groups.push(familyGroupIds.get(node.parent)!);

      if (options.useRectangles) {
        const textId = this.generateId();
        const rectBoundElements = [...boundElements, { id: textId, type: "text" }];
        elements.push(this.createRectangle(nx, ny, nodeWidth, 45, bgColor, id, groups, rectBoundElements));
        elements.push(this.createText(nx, ny, displayName, options.textAngle, textId, nodeWidth, "center", groups, id));
      } else {
        const nodeGroupId = this.generateId();
        const combinedGroups = [nodeGroupId, ...groups];
        elements.push(this.createDot(nx, ny, bgColor, id, combinedGroups, boundElements));
        elements.push(this.createText(nx + 10, ny - 10, displayName, options.textAngle, this.generateId(), nodeWidth, "left", combinedGroups));
      }
    });

    return elements;
  }

  private static drawRadialLayout(root: d3.HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    const elements: any[] = [];
    const nodeIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    const familyGroupIds = new Map<d3.HierarchyPointNode<PersonNode>, string>();
    const boundElementsMap = new Map<string, { id: string, type: string }[]>();

    const addBoundElement = (nodeId: string, arrowId: string) => {
      if (!boundElementsMap.has(nodeId)) boundElementsMap.set(nodeId, []);
      boundElementsMap.get(nodeId)!.push({ id: arrowId, type: "arrow" });
    };
    
    root.each(node => {
      nodeIds.set(node, this.generateId());
      familyGroupIds.set(node, this.generateId());
    });

    const project = (x: number, y: number) => {
      const angle = (options.direction === 'rtl' ? -x : x) - Math.PI / 2;
      const radius = y;
      return [radius * Math.cos(angle), radius * Math.sin(angle)];
    };

    root.links().forEach(link => {
      const sourceId = nodeIds.get(link.source)!;
      const targetId = nodeIds.get(link.target)!;
      const groupId = familyGroupIds.get(link.source)!;
      const arrowId = this.generateId();

      const [sx, sy] = project(link.source.x, link.source.y);
      const [tx, ty] = project(link.target.x, link.target.y);
      
      // Radial Curve: middle control point to follow circular flow
      const midAngle = (link.source.x + link.target.x) / 2;
      const midRadius = (link.source.y + link.target.y) / 2;
      const [mx, my] = project(midAngle, midRadius);
      const points: [number, number][] = [[sx, sy], [mx, my], [tx, ty]];

      elements.push(this.createArrow(arrowId, points, sourceId, targetId, [groupId], options));
      addBoundElement(sourceId, arrowId);
      addBoundElement(targetId, arrowId);
    });

    root.each(node => {
      const [x, y] = project(node.x, node.y);
      const id = nodeIds.get(node)!;
      const gen = node.data.generation || 0;
      const bgColor = this.getGenerationColor(gen);
      
      const displayName = this.getNodeDisplayName(node, options.includeDates);
      const nodeWidth = this.getNodeWidth(displayName);
      const boundElements = boundElementsMap.get(id) || [];

      const groups = [familyGroupIds.get(node)!];
      if (node.parent) groups.push(familyGroupIds.get(node.parent)!);

      // Intelligent Labeling & Geometry
      let textAngleDegrees = ((options.direction === 'rtl' ? -node.x : node.x) * 180 / Math.PI) - 90;
      let textAlign = "left";
      
      // Normalize angle to [0, 360)
      let normalizedAngle = ((textAngleDegrees % 360) + 360) % 360;
      
      // If label is in the left hemisphere (90 to 270), flip it 180 so it remains readable
      if (normalizedAngle > 90 && normalizedAngle < 270) {
        textAngleDegrees += 180;
        textAlign = "right";
      }
      
      if (options.textAngle !== 0) {
         textAngleDegrees = options.textAngle;
         textAlign = "center";
      }

      if (options.useRectangles) {
        const textId = this.generateId();
        const rectBoundElements = [...boundElements, { id: textId, type: "text" }];
        elements.push(this.createRectangle(x, y, nodeWidth, 40, bgColor, id, groups, rectBoundElements));
        elements.push(this.createText(x, y, displayName, textAngleDegrees, textId, nodeWidth, textAlign, groups, id));
      } else {
        // No-Rectangle Mode
        const nodeGroupId = this.generateId();
        const combinedGroups = [nodeGroupId, ...groups];
        elements.push(this.createDot(x, y, bgColor, id, combinedGroups, boundElements));
        
        // Offset text slightly in direction of radius
        const offsetDist = 12;
        const angleRad = ((options.direction === 'rtl' ? -node.x : node.x) - Math.PI / 2);
        const textOffsetX = Math.cos(angleRad) * offsetDist;
        const textOffsetY = Math.sin(angleRad) * offsetDist;

        elements.push(this.createText(x + textOffsetX, y + textOffsetY - 10, displayName, textAngleDegrees, this.generateId(), nodeWidth, textAlign, combinedGroups));
      }
    });

    return elements;
  }
}
