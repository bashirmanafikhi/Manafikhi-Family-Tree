'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  isAlive: boolean;
  profileImage: string | null;
  fatherId: string | null;
  motherId: string | null;
}

interface TreeNode {
  person: Person;
  children: TreeNode[];
  generation: number;
}

function getAncestors(person: Person, allPersons: Person[], maxGen = 3): TreeNode {
  const getPerson = (id: string | null): Person | undefined => 
    id ? allPersons.find(p => p.id === id) : undefined;

  const buildNode = (p: Person, gen: number): TreeNode => {
    if (gen >= maxGen) return { person: p, children: [], generation: gen };
    
    const father = getPerson(p.fatherId);
    const mother = getPerson(p.motherId);
    
    const children: TreeNode[] = [];
    if (father) children.push(buildNode(father, gen + 1));
    if (mother) children.push(buildNode(mother, gen + 1));
    
    return { person: p, children, generation: gen };
  };

  return buildNode(person, 0);
}

const arabicOrdinals: Record<number, string> = {
  1: 'الأول',
  2: 'الثاني',
  3: 'الثالث',
  4: 'الرابع',
  5: 'الخامس',
  6: 'السادس',
  7: 'السابع',
  8: 'الثامن',
  9: 'التاسع',
  10: 'العاشر',
};

function getArabicOrdinal(n: number): string {
  return arabicOrdinals[n] || `رقم ${n}`;
}

function getDescendants(person: Person, allPersons: Person[], maxGen = 3): TreeNode {
  const getChildren = (parentId: string): Person[] => 
    allPersons.filter(p => p.fatherId === parentId || p.motherId === parentId);

  const buildNode = (p: Person, gen: number): TreeNode => {
    if (gen >= maxGen) return { person: p, children: [], generation: gen };
    
    const childPersons = getChildren(p.id);
    const children = childPersons.map(c => buildNode(c, gen + 1));
    
    return { person: p, children, generation: gen };
  };

  return buildNode(person, 0);
}

function flattenAncestors(node: TreeNode, result: Map<number, TreeNode[]>): Map<number, TreeNode[]> {
  const existing = result.get(node.generation) || [];
  const alreadyExists = existing.some(n => n.person.id === node.person.id);
  if (!alreadyExists) {
    result.set(node.generation, [...existing, node]);
  }
  
  for (const child of node.children) {
    flattenAncestors(child, result);
  }
  
  return result;
}

function flattenDescendants(node: TreeNode, result: Map<number, TreeNode[]>): Map<number, TreeNode[]> {
  const existing = result.get(node.generation) || [];
  const alreadyExists = existing.some(n => n.person.id === node.person.id);
  if (!alreadyExists) {
    result.set(node.generation, [...existing, node]);
  }
  
  for (const child of node.children) {
    flattenDescendants(child, result);
  }
  
  return result;
}

function TreeNodeComponent({ node, size = 'normal' }: { node: TreeNode; size?: 'normal' | 'large' }) {
  const { person } = node;
  const isMale = person.gender === 'MALE';
  const sizeClass = size === 'large' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-xs';
  const nameSizeClass = size === 'large' ? 'text-xs' : 'text-[8px]';
  const maxWidth = size === 'large' ? '60px' : '40px';
  const isDeceased = !person.isAlive;
  
  return (
    <Link href={`/persons/${person.id}`} className="group flex flex-col items-center">
      <div className={`relative ${sizeClass} rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ring-2 ${
        isDeceased ? 'ring-gray-400' : (isMale ? 'ring-[#0d5c63]' : 'ring-[#e07a5f]')
      }`}>
        {person.profileImage ? (
          <img src={`/${person.profileImage}`} alt="" className={`w-full h-full object-cover ${isDeceased ? 'grayscale' : ''}`} />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-white font-bold ${
            isDeceased ? 'bg-gradient-to-br from-gray-400 to-gray-500' : (isMale ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]')
          }`}>
            {person.firstName.charAt(0)}
          </div>
        )}
        {isDeceased && (
          <>
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gray-500" />
            <div className="absolute inset-0 ring-1 ring-inset ring-gray-400/50 rounded-xl" />
          </>
        )}
      </div>
      <span className={`${nameSizeClass} mt-1 text-center text-[#2d2926] font-medium max-w-[${maxWidth}] truncate`}>
        {person.firstName}
      </span>
    </Link>
  );
}

function GenerationRow({ nodes, isAncestor = false, size = 'normal' }: { nodes: TreeNode[]; isAncestor?: boolean; size?: 'normal' | 'large' }) {
  if (nodes.length === 0) return null;
  
  const lineColor = isAncestor ? 'bg-[#0d5c63]' : 'bg-[#e07a5f]';
  
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-start justify-center gap-3">
        {nodes.map((node, i) => (
          <div key={i} className="flex flex-col items-center">
            <TreeNodeComponent node={node} size={size} />
          </div>
        ))}
      </div>
      <div className={`w-0.5 h-4 ${lineColor}/50`} />
    </div>
  );
}

interface FamilyTreeProps {
  person: Person;
  allPersons: Person[];
}

export default function FamilyTree({ person, allPersons }: FamilyTreeProps) {
  const [showTree, setShowTree] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPinchDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(1);
  
  const ancestorTree = useMemo(() => getAncestors(person, allPersons, 10), [person, allPersons]);
  const descendantTree = useMemo(() => getDescendants(person, allPersons, 10), [person, allPersons]);
  
  const ancestorGenerations = useMemo(() => {
    const map = new Map<number, TreeNode[]>();
    flattenAncestors(ancestorTree, map);
    const sorted = Array.from(map.entries())
      .filter(([gen]) => gen > 0)
      .sort((a, b) => b[0] - a[0]);
    return sorted;
  }, [ancestorTree]);
  
  const descendantGenerations = useMemo(() => {
    const map = new Map<number, TreeNode[]>();
    flattenDescendants(descendantTree, map);
    return Array.from(map.entries())
      .filter(([gen]) => gen > 0)
      .sort((a, b) => a[0] - b[0]);
  }, [descendantTree]);
  
  const hasAncestors = ancestorGenerations.length > 0;
  const hasDescendants = descendantGenerations.length > 0;
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
      initialPinchDistance.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      initialPinchDistance.current = getDistance(e.touches[0], e.touches[1]);
      initialZoom.current = zoom;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      setPan({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    } else if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance.current;
      const newZoom = Math.min(Math.max(initialZoom.current * scale, 0.5), 2);
      setZoom(newZoom);
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      initialPinchDistance.current = null;
    }
  };
  
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  if (!hasAncestors && !hasDescendants) return null;
  
  return (
    <div className="mt-8">
      <button
        onClick={() => setShowTree(!showTree)}
        className="w-full card p-4 flex items-center justify-between hover:bg-[#f8f6f3] transition-all group"
      >
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#0d5c63' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          شجرة العائلة
        </h2>
        <span className={`transform transition-transform duration-300 ${showTree ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-[#9c9690] group-hover:text-[#0d5c63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      
      {showTree && (
        <div className="card mt-2">
          <div className="flex items-center justify-between p-3 border-b border-[#e8e4de]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
                className="p-2 rounded-lg hover:bg-[#f0ede8] transition-colors"
                title="تكبير"
              >
                <svg className="w-4 h-4 text-[#6b6560]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              <button
                onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
                className="p-2 rounded-lg hover:bg-[#f0ede8] transition-colors"
                title="تصغير"
              >
                <svg className="w-4 h-4 text-[#6b6560]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="text-xs text-[#9c9690] min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            </div>
            <button
                onClick={resetView}
                className="text-xs px-3 py-1 rounded-lg hover:bg-[#f0ede8] transition-colors text-[#6b6560]"
              >
                إعادة تعيين
              </button>
          </div>
          
          <div 
            ref={containerRef}
            className="overflow-hidden h-[600px] relative cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <div className="flex flex-col items-center gap-0 py-8">
                {/* Ancestors (older generations on top) */}
                {ancestorGenerations.map(([gen, nodes], genIndex) => {
                  const generationLabels: Record<number, string> = {
                    4: 'أجداد الأجداد',
                    3: 'والدي الأجداد',
                    2: 'الأجداد',
                    1: 'الوالدان',
                  };
                  const totalGens = ancestorGenerations.length;
                  const isClosest = genIndex === totalGens - 1;
                  return (
                    <div key={`ancestor-${gen}`} className="flex flex-col items-center mb-1">
                      <span className="text-[10px] font-medium text-[#0d5c63] mb-2 bg-[#e6f4ef] px-2 py-0.5 rounded-full">
                        {generationLabels[gen] || `الأجداد الجيل ${getArabicOrdinal(gen)}`} ({nodes.length})
                      </span>
                      <GenerationRow nodes={nodes} isAncestor={true} size={isClosest ? 'normal' : 'normal'} />
                    </div>
                  );
                })}
                
                {/* Current Person (larger) */}
                <div className="flex flex-col items-center my-2">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-[#0d5c63]/30 to-[#0d5c63]" />
                  <div className="relative">
                    <div className={`relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl ring-4 transition-all ${
                      person.gender === 'MALE' ? 'ring-[#0d5c63]' : 'ring-[#e07a5f]'
                    } ${!person.isAlive ? 'saturate-0 opacity-70 sepia-[0.3]' : ''}`}>
                      {person.profileImage ? (
                        <img src={`/${person.profileImage}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white font-bold text-2xl ${
                          person.gender === 'MALE' ? 'bg-gradient-to-br from-[#0d5c63] to-[#14919b]' : 'bg-gradient-to-br from-[#e07a5f] to-[#f2a98e]'
                        }`}>
                          {person.firstName.charAt(0)}
                        </div>
                      )}
                    </div>
                    {!person.isAlive && (
                      <>
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#8b7355] border-2 border-white" />
                        <div className="absolute inset-0 ring-2 ring-inset ring-[#8b7355]/40 rounded-2xl" />
                      </>
                    )}
                  </div>
                  <p className="mt-2 font-bold text-[#2d2926] text-sm">{person.firstName} {person.lastName}</p>
                  <div className="w-0.5 h-6 bg-gradient-to-b from-[#0d5c63] to-[#e07a5f]/30" />
                </div>
                
                {/* Descendants (younger generations below) */}
                {descendantGenerations.map(([gen, nodes], genIndex) => {
                  const generationLabels: Record<number, string> = {
                    1: 'الأولاد',
                    2: 'الأحفاد',
                    3: 'أبناء الأحفاد',
                    4: 'أحفاد الأحفاد',
                  };
                  const isClosest = genIndex === 0;
                  return (
                    <div key={`descendant-${gen}`} className="flex flex-col items-center mb-1">
                      <span className="text-[10px] font-medium text-[#e07a5f] mb-2 bg-[#fceee8] px-2 py-0.5 rounded-full">
                        {generationLabels[gen] || `النسل ${getArabicOrdinal(gen)}`} ({nodes.length})
                      </span>
                      <GenerationRow nodes={nodes} isAncestor={false} size={isClosest ? 'normal' : 'normal'} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="p-3 border-t border-[#e8e4de] text-xs text-[#9c9690] text-center">
            اسحب للتحريك • استخدم الأزرار للتكبير والتصغير
          </div>
        </div>
      )}
    </div>
  );
}