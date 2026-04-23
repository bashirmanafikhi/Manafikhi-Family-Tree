'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
// @ts-ignore
import dagre from '@dagrejs/dagre'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PersonNode {
  id: string
  firstName: string
  lastName?: string | null
  gender: string
  isAlive: boolean
  fatherId?: string | null
  motherId?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NODE_WIDTH = 150
const NODE_HEIGHT = 50

// ─────────────────────────────────────────────────────────────────────────────
// Custom node component (memoised outside render to avoid RF warning)
// ─────────────────────────────────────────────────────────────────────────────

function PersonCard({ data }: { data: { label: string; gender: string; isAlive: boolean } }) {
  const isMale = data.gender === 'MALE'
  return (
    <div
      style={{
        background: isMale
          ? 'linear-gradient(135deg,#0d5c63 0%,#14919b 100%)'
          : 'linear-gradient(135deg,#9d3a30 0%,#e07a5f 100%)',
        border: `2px solid ${data.isAlive ? '#4ade80' : '#f87171'}`,
        borderRadius: 10,
        padding: '6px 12px',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'center',
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

// IMPORTANT: define nodeTypes outside component so the reference is stable
const nodeTypes: NodeTypes = { person: PersonCard }

// ─────────────────────────────────────────────────────────────────────────────
// Dagre layout
// ─────────────────────────────────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph({ multigraph: false })
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'TB',
    nodesep: 30,
    ranksep: 70,
    marginx: 30,
    marginy: 30,
  })

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  // Use only one edge per pair to keep the graph acyclic for dagre
  const edgePairs = new Set<string>()
  edges.forEach((e) => {
    const key = `${e.source}→${e.target}`
    if (!edgePairs.has(key)) {
      edgePairs.add(key)
      g.setEdge(e.source, e.target)
    }
  })

  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    if (!pos) return n
    return {
      ...n,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function FamilyTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedPerson, setSelectedPerson] = useState<PersonNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ persons: 0, edges: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)

    // Load all persons (API must support large limit)
    fetch('/api/persons?limit=2000')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        const persons: PersonNode[] = data.data ?? []
        const idSet = new Set(persons.map((p) => p.id))

        // ── Raw nodes ────────────────────────────────────────────────────
        const rawNodes: Node[] = persons.map((p) => ({
          id: p.id,
          type: 'person',
          position: { x: 0, y: 0 },
          data: {
            label: p.firstName + (p.lastName ? ` ${p.lastName}` : ''),
            gender: p.gender,
            isAlive: p.isAlive,
            person: p,
          },
        }))

        // ── Raw edges ─────────────────────────────────────────────────────
        // Only ONE edge per parent→child (prefer father; mother is dashed)
        const rawEdges: Edge[] = []

        persons.forEach((p) => {
          if (p.fatherId && idSet.has(p.fatherId)) {
            rawEdges.push({
              id: `f-${p.fatherId}-${p.id}`,
              source: p.fatherId,
              target: p.id,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#0d5c63' },
              style: { stroke: '#0d5c63', strokeWidth: 1.5 },
            })
          }
          if (p.motherId && idSet.has(p.motherId)) {
            rawEdges.push({
              id: `m-${p.motherId}-${p.id}`,
              source: p.motherId,
              target: p.id,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#e07a5f' },
              style: { stroke: '#e07a5f', strokeWidth: 1.5, strokeDasharray: '5 3' },
            })
          }
        })

        // ── Dagre layout ──────────────────────────────────────────────────
        const laid = applyDagreLayout(rawNodes, rawEdges)

        setNodes(laid)
        setEdges(rawEdges)
        setStats({ persons: persons.length, edges: rawEdges.length })
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [setNodes, setEdges])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedPerson(node.data?.person ?? null)
  }, [])

  // ── Loading / error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-[85vh] flex flex-col items-center justify-center gap-4 bg-gray-50 rounded-xl">
        <div className="w-12 h-12 border-4 border-[#0d5c63] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">جاري تحميل الشجرة… قد تستغرق لحظة</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[85vh] flex items-center justify-center text-red-500 bg-gray-50 rounded-xl">
        خطأ: {error}
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: '85vh' }}>
      {/* Stats bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-500 shadow-sm select-none">
        <span>👤 {stats.persons} شخص</span>
        <span className="border-l border-gray-200 pl-4">🔗 {stats.edges} علاقة</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.02}
        maxZoom={2.5}
        defaultEdgeOptions={{ animated: false }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          showInteractive={false}
          style={{ bottom: 12, left: 12 }}
        />
        <MiniMap
          nodeColor={(n) => n.data?.gender === 'MALE' ? '#0d5c63' : '#e07a5f'}
          maskColor="rgba(255,255,255,0.55)"
          style={{ bottom: 12, right: 12, borderRadius: 8 }}
          zoomable
          pannable
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#d1d5db"
        />
      </ReactFlow>

      {/* Selected person info panel */}
      {selectedPerson && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 min-w-[280px]">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{
              background:
                selectedPerson.gender === 'MALE'
                  ? 'linear-gradient(135deg,#0d5c63,#14919b)'
                  : 'linear-gradient(135deg,#9d3a30,#e07a5f)',
            }}
          >
            {selectedPerson.firstName.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-right" dir="rtl">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {selectedPerson.firstName} {selectedPerson.lastName ?? ''}
            </p>
            <p className="text-xs text-gray-400">
              {selectedPerson.gender === 'MALE' ? 'ذكر' : 'أنثى'} ·{' '}
              {selectedPerson.isAlive ? '🟢 حي' : '🔴 متوفى'}
            </p>
          </div>

          {/* Link */}
          <a
            href={`/persons/${selectedPerson.id}`}
            className="shrink-0 text-sm font-medium text-[#0d5c63] hover:underline whitespace-nowrap"
          >
            تفاصيل ←
          </a>

          {/* Close */}
          <button
            onClick={() => setSelectedPerson(null)}
            className="shrink-0 text-gray-300 hover:text-gray-500 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 shadow-sm select-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg,#0d5c63,#14919b)' }} />
          <span>ذكر</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg,#9d3a30,#e07a5f)' }} />
          <span>أنثى</span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[#0d5c63]" />
          <span>أب → طفل</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[#e07a5f]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#e07a5f 0,#e07a5f 4px,transparent 4px,transparent 7px)' }} />
          <span>أم → طفل</span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border-2 border-green-400" />
          <span>حي</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border-2 border-red-400" />
          <span>متوفى</span>
        </div>
      </div>
    </div>
  )
}