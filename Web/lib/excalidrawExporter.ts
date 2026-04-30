import { hierarchy, tree as d3Tree, HierarchyPointNode, HierarchyLink } from 'd3-hierarchy';

export interface PersonNode {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  isAlive: boolean;
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
  textAngle: number;
  compactSpacing: boolean;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineSharpness: 'round' | 'sharp';
  direction: 'ltr' | 'rtl';
  strokeWidth: number;
  linkOpacity: number;
  generationSpacing: number;
}

export class ExcalidrawExporter {
  static generateJson(rootPerson: PersonNode, allPersons: any[], options: ExcalidrawExportOptions) {
    const rootNode = this.buildHierarchy(rootPerson, allPersons, 0, options.maxGenerations);
    const d3Hierarchy = hierarchy(rootNode);
    let elements: any[] = [];

    if (options.layout === 'radial') {
      const radiusStep = options.generationSpacing || 100;
      const treeLayout = d3Tree<PersonNode>()
        .size([2 * Math.PI, 1])
        .separation((a, b) => (a.parent === b.parent ? 0.7 : 1.1) / Math.max(1, a.depth))(d3Hierarchy);

      treeLayout.each(d => {
        const node = d as HierarchyPointNode<PersonNode>;
        node.y = node.depth * radiusStep;
      });
      elements = this.drawRadialLayout(treeLayout as HierarchyPointNode<PersonNode>, options);
    } else {
      const isHoriz = options.layout === 'horizontal';
      const dx = options.compactSpacing ? (isHoriz ? 30 : 80) : (isHoriz ? 50 : 140);
      const dy = options.generationSpacing || (isHoriz ? 180 : 70);
      const treeLayout = d3Tree<PersonNode>().nodeSize([dx, dy])(d3Hierarchy);
      elements = isHoriz ? this.drawHorizontalLayout(treeLayout as HierarchyPointNode<PersonNode>, options) : this.drawVerticalLayout(treeLayout as HierarchyPointNode<PersonNode>, options);
    }

    return {
      type: "excalidraw",
      version: 2,
      source: "https://family-tree-app",
      elements: elements,
      appState: { viewBackgroundColor: "#ffffff" }
    };
  }

  private static buildHierarchy(person: any, allPersons: any[], currentGen: number, maxGen: number): PersonNode {
    const node: PersonNode = { ...person, generation: currentGen };
    if (currentGen < maxGen) {
      const children = allPersons.filter(p => p.fatherId === person.id || p.motherId === person.id);
      node.children = children.map(c => this.buildHierarchy(c, allPersons, currentGen + 1, maxGen));
    }
    return node;
  }

  private static generateId() { return Math.random().toString(36).substr(2, 9); }

  private static getGenerationColor(generation: number) {
    const colors = ["#e3f2fd", "#f3e5f5", "#e8f5e9", "#fff3e0", "#ffebee", "#e0f7fa", "#fff8e1"];
    return colors[generation % colors.length];
  }

  private static createRectangle(x: number, y: number, width: number, height: number, bgColor: string, id: string, groupIds: string[], boundElements: any[], strokeWidth: number) {
    return {
      type: "rectangle",
      id,
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      strokeColor: "#1e1e1e",
      backgroundColor: bgColor,
      fillStyle: "solid",
      strokeWidth,
      roughness: 0,
      roundness: { type: 3 },
      groupIds,
      boundElements,
      version: 1, versionNonce: Math.random()
    };
  }

  private static createDot(x: number, y: number, bgColor: string, id: string, groupIds: string[], boundElements: any[], strokeWidth: number) {
    return {
      type: "ellipse",
      id,
      x: x - 3, y: y - 3,
      width: 6, height: 6,
      strokeColor: "#333333",
      backgroundColor: bgColor,
      fillStyle: "solid",
      strokeWidth,
      roughness: 0,
      groupIds,
      boundElements,
      version: 1, versionNonce: Math.random()
    };
  }

  private static createText(x: number, y: number, text: string, angle: number, id: string, width: number, height: number, textAlign: string, groupIds: string[], containerId: string | null) {
    return {
      type: "text",
      id,
      x: containerId ? x - width / 2 : x,
      y: y - height / 2,
      text,
      fontSize: 11,
      fontFamily: 1,
      textAlign,
      verticalAlign: "middle",
      containerId,
      angle: (angle * Math.PI) / 180,
      width,
      height,
      strokeColor: "#000000",
      groupIds,
      version: 1, versionNonce: Math.random()
    };
  }

  private static createArrow(points: [number, number][], startId: string, endId: string, groupIds: string[], options: ExcalidrawExportOptions) {
    const startX = points[0][0];
    const startY = points[0][1];
    return {
      type: "arrow",
      id: this.generateId(),
      x: startX,
      y: startY,
      points: points.map(p => [p[0] - startX, p[1] - startY]),
      strokeColor: "#adb5bd",
      strokeWidth: options.strokeWidth,
      strokeStyle: options.lineStyle,
      strokeSharpness: options.lineSharpness,
      opacity: options.linkOpacity,
      startBinding: { elementId: startId, focus: 0, gap: 0 },
      endBinding: { elementId: endId, focus: 0, gap: 0 },
      groupIds,
      version: 1, versionNonce: Math.random()
    };
  }

  private static processNodes(root: HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions, projectFn: (node: HierarchyPointNode<PersonNode>) => [number, number], arrowFn: (link: HierarchyLink<PersonNode>) => [number, number][]) {
    const elements: any[] = [];
    const nodeIds = new Map<HierarchyPointNode<PersonNode>, string>();
    const boundMap = new Map<string, any[]>();

    root.each(n => {
      const id = this.generateId();
      nodeIds.set(n, id);
      boundMap.set(id, []);
    });

    root.links().forEach(link => {
      const points = arrowFn(link);
      const sourceId = nodeIds.get(link.source as HierarchyPointNode<PersonNode>)!;
      const targetId = nodeIds.get(link.target as HierarchyPointNode<PersonNode>)!;
      const arrow = this.createArrow(points, sourceId, targetId, [], options);
      elements.push(arrow);
      boundMap.get(sourceId)?.push({ id: arrow.id, type: "arrow" });
      boundMap.get(targetId)?.push({ id: arrow.id, type: "arrow" });
    });

    root.each(node => {
      const [nx, ny] = projectFn(node);
      const id = nodeIds.get(node)!;
      const group = [this.generateId()];
      const text = node.data.firstName;
      const genColor = this.getGenerationColor(node.data.generation || 0);

      if (options.useRectangles) {
        const textId = this.generateId();
        const rectW = 85, rectH = 22;
        // النص يوضع تماماً في المركز (Zero Offset)
        elements.push(this.createRectangle(nx, ny, rectW, rectH, genColor, id, group, [...(boundMap.get(id) || []), { id: textId, type: "text" }], options.strokeWidth));
        elements.push(this.createText(nx, ny, text, 0, textId, rectW, rectH, "center", group, id));
      } else {
        elements.push(this.createDot(nx, ny, genColor, id, group, boundMap.get(id) || [], options.strokeWidth));

        let angle = 0;
        let textAlign: "left" | "right" | "center" = "left";

        if (options.layout === 'radial') {
          const rawAngle = (options.direction === 'rtl' ? -node.x : node.x) - Math.PI / 2;
          const deg = (rawAngle * 180) / Math.PI;

          const isLeftHalf = Math.cos(rawAngle) < 0;
          textAlign = isLeftHalf ? "right" : "left";

          // زاوية النص تتبع الشعاع ليكون موازياً للخطوط
          angle = (deg % 360 + 360) % 360;
          if (angle > 90 && angle < 270) angle += 180;
        }

        // النص يبدأ من (nx, ny) تماماً بدون أي بكسل إضافي
        elements.push(this.createText(nx, ny, text, angle, this.generateId(), 80, 20, textAlign, group, null));
      }
    });

    return elements;
  }

  private static drawVerticalLayout(root: HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    return this.processNodes(root, options,
      (n) => [options.direction === 'rtl' ? -n.x : n.x, n.y],
      (l) => {
        const s = l.source as HierarchyPointNode<PersonNode>;
        const t = l.target as HierarchyPointNode<PersonNode>;
        const sx = options.direction === 'rtl' ? -s.x : s.x;
        const tx = options.direction === 'rtl' ? -t.x : t.x;
        return [[sx, s.y], [sx, (s.y + t.y) / 2], [tx, (s.y + t.y) / 2], [tx, t.y]];
      }
    );
  }

  private static drawHorizontalLayout(root: HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    return this.processNodes(root, options,
      (n) => [options.direction === 'rtl' ? -n.y : n.y, n.x],
      (l) => {
        const s = l.source as HierarchyPointNode<PersonNode>;
        const t = l.target as HierarchyPointNode<PersonNode>;
        const sx = options.direction === 'rtl' ? -s.y : s.y;
        const tx = options.direction === 'rtl' ? -t.y : t.y;
        return [[sx, s.x], [(sx + tx) / 2, s.x], [(sx + tx) / 2, t.x], [tx, t.x]];
      }
    );
  }

  private static drawRadialLayout(root: HierarchyPointNode<PersonNode>, options: ExcalidrawExportOptions) {
    const project = (x: number, y: number) => {
      const angle = (options.direction === 'rtl' ? -x : x) - Math.PI / 2;
      return [y * Math.cos(angle), y * Math.sin(angle)] as [number, number];
    };
    return this.processNodes(root, options,
      (n) => project(n.x, n.y),
      (l) => {
        const s = l.source as HierarchyPointNode<PersonNode>;
        const t = l.target as HierarchyPointNode<PersonNode>;
        const [sx, sy] = project(s.x, s.y);
        const [tx, ty] = project(t.x, t.y);
        if (s.depth === 0) return [[sx, sy], [tx, ty]];
        const [mx, my] = project(t.x, (s.y + t.y) / 2);
        return [[sx, sy], [mx, my], [tx, ty]];
      }
    );
  }
}