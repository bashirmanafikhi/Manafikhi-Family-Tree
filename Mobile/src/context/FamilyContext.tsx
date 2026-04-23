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
    
    const node = canvasData.nodes.find(n => n.id === nodeId);
    if (!node) return null;

    // Priority 1: Direct linking via 'file' property (e.g. "people/51071acea696ccb3.md")
    // This is the primary method used by the Obsidian plugin.
    if (node.file) {
      const personId = node.file
        .replace(/^people\//, '') // Remove top level 'people/' folder
        .replace(/\.md$/, '');    // Remove extension
      
      const person = persons.find(p => p.id === personId);
      if (person) return person;
    }
    
    // Priority 2: Direct ID match (Fallover for nodes where 'file' prop isn't set yet)
    // If a person file exists named after the Node ID, use it.
    const personById = persons.find(p => p.id === node.id);
    if (personById) return personById;
    
    return null;
  }

  function getTreeForNode(nodeId: string): TreeNode | null {
    if (!canvasData) return null;
    
    const node = canvasData.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    const person = getPersonForNode(nodeId);
    const children = getChildNodes(canvasData.edges, nodeId);
    const parents = getParentNodes(canvasData.edges, nodeId);
    
    // For file nodes, use the person's name if available
    const displayName = node.type === 'file' 
      ? (person?.name || node.file?.split('/').pop()?.replace('.md', '') || 'Unknown File')
      : node.text?.replace(/\n.*/g, '') || 'Unknown';

    return {
      id: node.id,
      personId: person?.id,
      name: displayName,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      color: node.color,
      children: [],
      parents: parents,
      isTextNode: node.type === 'text' || node.type === 'file', // Treat both as renderable nodes
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