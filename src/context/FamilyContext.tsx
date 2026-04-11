import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CanvasData, Person, FamilyTree, TreeNode, CanvasNode } from '../types';
import { loadCanvasDataAsync, loadCanvasData, getCanvasData, buildNodeMap, getChildNodes, getParentNodes } from '../parsers/canvas';
import { loadAllPersonsAsync, loadAllPersons } from '../parsers/markdown';

interface FamilyContextType {
  canvasData: CanvasData | null;
  persons: Person[];
  isLoading: boolean;
  error: string | null;
  getTreeForNode: (nodeId: string) => TreeNode | null;
  getPersonForNode: (nodeId: string) => Person | null;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      
      const canvas = await loadCanvasDataAsync();
      setCanvasData(canvas);
      
      const personsList = await loadAllPersonsAsync();
      setPersons(personsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  function getPersonForNode(nodeId: string): Person | null {
    if (!canvasData) return null;
    
    const nodeMap = new Map<string, CanvasNode>();
    canvasData.nodes.forEach(n => nodeMap.set(n.id, n));
    
    const node = nodeMap.get(nodeId);
    if (!node || node.type !== 'text') return null;
    
    const nodeText = node.text.replace(/\n.*/g, '').trim();
    
    const person = persons.find(p => 
      p.name === nodeText || 
      p.name.includes(nodeText) ||
      nodeText.includes(p.name)
    );
    
    return person || null;
  }

  function getTreeForNode(nodeId: string): TreeNode | null {
    if (!canvasData) return null;
    
    const nodeMap = new Map<string, CanvasNode>();
    canvasData.nodes.forEach(n => nodeMap.set(n.id, n));
    
    const node = nodeMap.get(nodeId);
    if (!node) return null;
    
    const children = getChildNodes(canvasData.edges, nodeId);
    const parents = getParentNodes(canvasData.edges, nodeId);
    
    return {
      id: node.id,
      personId: getPersonForNode(nodeId)?.id,
      name: node.text.replace(/\n.*/g, ''),
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      color: node.color,
      children: [],
      parents: parents,
      isTextNode: node.type === 'text',
    };
  }

  return (
    <FamilyContext.Provider value={{
      canvasData,
      persons,
      isLoading,
      error,
      getTreeForNode,
      getPersonForNode,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}