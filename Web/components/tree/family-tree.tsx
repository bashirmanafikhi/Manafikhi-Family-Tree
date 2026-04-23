'use client'

import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

interface PersonNode {
  id: string
  firstName: string
  lastName?: string
  gender: string
  isAlive: boolean
  fatherId?: string | null
  motherId?: string | null
}

export function FamilyTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/persons?limit=500')
      .then(r => r.json())
      .then(data => {
        const persons: PersonNode[] = data.data

        const treeNodes: Node[] = []
        const treeEdges: Edge[] = []
        
        const personIndexMap = new Map<string, number>()
        persons.forEach((p, i) => personIndexMap.set(p.id, i))

        const levels = new Map<string, number>()
        const childParentMap = new Map<string, { fatherId?: string; motherId?: string }>()
        
        persons.forEach(p => {
          if (p.fatherId || p.motherId) {
            childParentMap.set(p.id, { fatherId: p.fatherId || undefined, motherId: p.motherId || undefined })
          }
        })

        const visited = new Set<string>()
        
        const getLevel = (id: string): number => {
          if (visited.has(id)) return levels.get(id) || 0
          visited.add(id)
          
          const parents = childParentMap.get(id)
          if (!parents || (!parents.fatherId && !parents.motherId)) {
            levels.set(id, 0)
            return 0
          }
          
          let maxLevel = 0
          if (parents.fatherId && personIndexMap.has(parents.fatherId)) {
            maxLevel = Math.max(maxLevel, getLevel(parents.fatherId) + 1)
          }
          if (parents.motherId && personIndexMap.has(parents.motherId)) {
            maxLevel = Math.max(maxLevel, getLevel(parents.motherId) + 1)
          }
          
          levels.set(id, maxLevel)
          return maxLevel
        }

        persons.forEach(p => getLevel(p.id))

        const levelGroups = new Map<number, string[]>()
        persons.forEach(p => {
          const level = levels.get(p.id) || 0
          const group = levelGroups.get(level) || []
          group.push(p.id)
          levelGroups.set(level, group)
        })

        persons.forEach(p => {
          const level = levels.get(p.id) || 0
          const group = levelGroups.get(level) || []
          const indexInLevel = group.indexOf(p.id)
          
          const xSpacing = 200
          const ySpacing = 150
          
          const levelCenter = (group.length - 1) * xSpacing / 2
          const x = indexInLevel * xSpacing - levelCenter
          const y = level * ySpacing

          treeNodes.push({
            id: p.id,
            position: { x, y },
            data: { 
              label: `${p.firstName} ${p.lastName || ''}`,
              gender: p.gender,
              isAlive: p.isAlive,
            },
            style: {
              background: p.gender === 'MALE' ? '#e0f2fe' : '#fce7f3',
              border: p.isAlive ? '2px solid #22c55e' : '2px solid #ef4444',
              borderRadius: '8px',
              padding: '10px',
              minWidth: '150px',
            },
          })
        })

        persons.forEach(p => {
          if (p.fatherId && personIndexMap.has(p.fatherId)) {
            treeEdges.push({
              id: `e-${p.fatherId}-${p.id}`,
              source: p.fatherId,
              target: p.id,
              type: 'smoothstep',
            })
          }
          if (p.motherId && personIndexMap.has(p.motherId)) {
            treeEdges.push({
              id: `e-${p.motherId}-${p.id}`,
              source: p.motherId,
              target: p.id,
              type: 'smoothstep',
              style: { strokeDasharray: '5,5' },
            })
          }
        })

        setNodes(treeNodes)
        setEdges(treeEdges)
      })
  }, [setNodes, setEdges])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.id)
  }, [])

  return (
    <div className="h-[80vh] border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
      
      {selectedNode && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
          <a href={`/persons/${selectedNode}`} className="text-blue-600 hover:underline">
            عرض التفاصيل →
          </a>
        </div>
      )}
    </div>
  )
}