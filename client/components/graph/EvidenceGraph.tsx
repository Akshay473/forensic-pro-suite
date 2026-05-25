"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertTriangle, Filter, X, Activity, Maximize2, Minimize2 } from "lucide-react";
import { nodeTypes } from "./GraphNodes";
import ProvenanceSidebar, { type GraphNode, type SuspiciousPattern } from "./ProvenanceSidebar";
import dagre from "dagre";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawNode {
  id: string;
  type: string;
  label: string;
  metadata: Record<string, string | undefined>;
  suspicious?: boolean;
}

interface RawEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  metadata?: Record<string, string | undefined>;
}

interface GraphData {
  nodes: RawNode[];
  edges: RawEdge[];
  suspicious_patterns: SuspiciousPattern[];
  stats: {
    total_nodes: number;
    total_edges: number;
    suspicious_count: number;
    cases_processed: number;
  };
}

interface EvidenceGraphProps {
  data: GraphData;
}

// ---------------------------------------------------------------------------
// Edge color mapping by relationship type
// ---------------------------------------------------------------------------

const EDGE_COLOR: Record<string, string> = {
  CONTAINS: "#10b981",
  HAS_HASH: "#a855f7",
  ASSIGNED_TO: "#f59e0b",
  ORIGINATED_FROM: "#ef4444",
  ACQUIRED_FROM: "#06b6d4",
  SHARED_INDICATOR: "#ef4444",
  SHARED_IP: "#f97316",
};

const NODE_FILTER_OPTIONS = [
  { type: "case",        label: "Cases",        color: "#10b981" },
  { type: "evidence",    label: "Evidence",     color: "#3b82f6" },
  { type: "hash",        label: "Hashes",       color: "#a855f7" },
  { type: "investigator",label: "Investigators",color: "#f59e0b" },
  { type: "ip_address",  label: "IP Addresses", color: "#ef4444" },
  { type: "device",      label: "Devices",      color: "#06b6d4" },
];

// ---------------------------------------------------------------------------
// Dagre Layout
// ---------------------------------------------------------------------------

type LayoutStrategy = "flat" | "type" | "case";

function getLayoutedElements(rawNodes: RawNode[], rawEdges: RawEdge[], strategy: LayoutStrategy = "flat") {
  const dagreGraph = new dagre.graphlib.Graph({ compound: strategy !== "flat" });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR", ranksep: 150, nodesep: 60 });

  const initialNodes: Node[] = rawNodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: 0, y: 0 },
    data: { label: n.label, metadata: n.metadata, suspicious: n.suspicious },
    draggable: true,
  }));

  // Create Parent Nodes based on strategy
  const parentNodes: Node[] = [];
  if (strategy === "type") {
    NODE_FILTER_OPTIONS.forEach(opt => {
      const typeNodes = initialNodes.filter(n => n.type === opt.type);
      if (typeNodes.length > 0) {
        parentNodes.push({
          id: `group-${opt.type}`,
          type: "group",
          position: { x: 0, y: 0 },
          data: { label: `${opt.label} Group` },
          draggable: true,
          style: { width: 100, height: 100 }
        });
      }
    });
  } else if (strategy === "case") {
    const caseIds = new Set<string>();
    initialNodes.forEach(n => {
      const meta = n.data.metadata as Record<string, string> | undefined;
      const cid = meta?.case_id;
      if (cid) caseIds.add(cid);
      if (n.type === "case") caseIds.add(meta?.case_id || n.id.replace('case-', ''));
    });
    caseIds.forEach(cid => {
      parentNodes.push({
        id: `group-${cid}`,
        type: "group",
        position: { x: 0, y: 0 },
        data: { label: `Case: ${cid}` },
        draggable: true,
      });
    });
  }

  const initialEdges: Edge[] = rawEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.relationship,
    animated: ["SHARED_INDICATOR", "SHARED_IP", "SHARED_DEVICE", "circular_dependency"].some(pat => e.relationship.includes(pat)) || e.relationship.startsWith("SHARED_"),
    style: {
      stroke: EDGE_COLOR[e.relationship] || "#475569",
      strokeWidth: e.relationship.startsWith("SHARED_") ? 2 : 1.5,
      strokeDasharray: e.relationship.startsWith("SHARED_") ? "6 3" : undefined,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR[e.relationship] || "#475569" },
    labelStyle: { fill: "#94a3b8", fontSize: 9, fontFamily: "monospace" },
    labelBgStyle: { fill: "#0f172a", fillOpacity: 0.8 },
    data: { relationship: e.relationship },
  }));

  // Set nodes in Dagre
  parentNodes.forEach(node => {
    dagreGraph.setNode(node.id, { label: node.data.label });
  });

  initialNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 80 });
    
    // Assign parent
    if (strategy === "type") {
      dagreGraph.setParent(node.id, `group-${node.type}`);
    } else if (strategy === "case") {
      const meta = node.data.metadata as Record<string, string> | undefined;
      const cid = meta?.case_id || (node.type === "case" ? node.id.replace('case-', '') : null);
      if (cid && dagreGraph.hasNode(`group-${cid}`)) {
        dagreGraph.setParent(node.id, `group-${cid}`);
      }
    }
  });

  initialEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Apply layout positions
  const layoutedNodes = initialNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const meta = node.data.metadata as Record<string, string> | undefined;
    const parentId = strategy === "type" ? `group-${node.type}` : 
                     (strategy === "case" && (meta?.case_id || (node.type === "case" ? node.id.replace('case-', '') : null))) ? `group-${meta?.case_id || node.id.replace('case-', '')}` : undefined;
                     
    // If a node has a parent in React Flow, its position must be relative to the parent.
    // Dagre returns absolute positions. We must compute relative.
    let x = nodeWithPosition.x - 180 / 2;
    let y = nodeWithPosition.y - 80 / 2;
    
    if (parentId && dagreGraph.hasNode(parentId)) {
       const p = dagreGraph.node(parentId);
       x -= (p.x - p.width / 2);
       y -= (p.y - p.height / 2);
    }
    
    return {
      ...node,
      position: { x, y },
      parentId: dagreGraph.hasNode(parentId || "") ? parentId : undefined,
      extent: dagreGraph.hasNode(parentId || "") ? 'parent' as const : undefined,
    };
  });

  const layoutedParents = parentNodes.map(node => {
    const n = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: n.x - n.width / 2, y: n.y - n.height / 2 },
      style: { width: n.width, height: n.height }
    };
  });

  return { nodes: [...layoutedParents, ...layoutedNodes], edges: initialEdges };
}

// ---------------------------------------------------------------------------
// Inner graph (uses useReactFlow — must be inside ReactFlowProvider)
// ---------------------------------------------------------------------------

function InnerGraph({ data }: EvidenceGraphProps) {
  const { fitView, setCenter } = useReactFlow();

  const [layoutStrategy, setLayoutStrategy] = useState<LayoutStrategy>("flat");

  const layoutResult = useMemo(() => getLayoutedElements(data.nodes, data.edges, layoutStrategy), [data.nodes, data.edges, layoutStrategy]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutResult.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutResult.edges);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [collapsedCases, setCollapsedCases] = useState<Set<string>>(new Set());
  const [showAlerts, setShowAlerts] = useState(true);

  // Re-layout when data or strategy changes
  useEffect(() => {
    const layout = getLayoutedElements(data.nodes, data.edges, layoutStrategy);
    setNodes(layout.nodes);
    setEdges(layout.edges);
    setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 100);
  }, [data, layoutStrategy, setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  // Compute unshared nodes per case for expand/collapse logic
  const caseToUnsharedNodes = useMemo(() => {
    const edgeMap = new Map<string, Set<string>>(); // target/source -> set of case IDs
    data.edges.forEach(e => {
      const isSourceCase = e.source.startsWith("case-");
      const isTargetCase = e.target.startsWith("case-");
      if (isSourceCase && !isTargetCase) {
        if (!edgeMap.has(e.target)) edgeMap.set(e.target, new Set());
        edgeMap.get(e.target)!.add(e.source);
      }
      if (isTargetCase && !isSourceCase) {
        if (!edgeMap.has(e.source)) edgeMap.set(e.source, new Set());
        edgeMap.get(e.source)!.add(e.target);
      }
    });

    const mapping = new Map<string, string[]>(); // caseId -> unshared nodeIds
    edgeMap.forEach((caseIds, nodeId) => {
      if (caseIds.size === 1) {
        const caseId = Array.from(caseIds)[0];
        if (!mapping.has(caseId)) mapping.set(caseId, []);
        mapping.get(caseId)!.push(nodeId);
      }
    });
    return mapping;
  }, [data.edges]);

  // Filter nodes by active type filters + search query
  const visibleNodes = useMemo(() => {
    const hiddenByCollapse = new Set<string>();
    collapsedCases.forEach(caseId => {
      const unshared = caseToUnsharedNodes.get(caseId) || [];
      unshared.forEach(id => hiddenByCollapse.add(id));
    });

    return nodes.map((n) => {
      const typeHidden = activeFilters.size > 0 && !activeFilters.has(n.type as string);
      const searchHidden =
        searchQuery.trim().length > 0 &&
        !String(n.data.label).toLowerCase().includes(searchQuery.toLowerCase());
      
      const isHidden = typeHidden || searchHidden || hiddenByCollapse.has(n.id);
      
      const nData = n.type === "case" ? { ...n.data, collapsed: collapsedCases.has(n.id) } : n.data;

      return { ...n, hidden: isHidden, data: nData };
    });
  }, [nodes, activeFilters, searchQuery, collapsedCases, caseToUnsharedNodes]);

  // Node click → open sidebar
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const raw = data.nodes.find((n) => n.id === node.id);
      if (raw) setSelectedNode(raw as GraphNode);
    },
    [data.nodes]
  );

  const onNodeDoubleClick = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      if (node.type === "case") {
        setCollapsedCases(prev => {
          const next = new Set(prev);
          if (next.has(node.id)) next.delete(node.id);
          else next.add(node.id);
          return next;
        });
      } else {
        try {
          const res = await fetch(`/api/graph/expand/${node.id}`);
          if (!res.ok) return;
          const json = await res.json();
          if (json && json.nodes && json.edges) {
            const existingNodeIds = new Set(nodes.map(n => n.id));
            const existingEdgeIds = new Set(edges.map(e => e.id));
            
            const newNodes = json.nodes.filter((n: RawNode) => !existingNodeIds.has(n.id));
            const newEdges = json.edges.filter((e: RawEdge) => !existingEdgeIds.has(e.id));
            
            if (newNodes.length > 0 || newEdges.length > 0) {
              const combinedNodes = [...data.nodes, ...newNodes];
              const combinedEdges = [...data.edges, ...newEdges];
              const layout = getLayoutedElements(combinedNodes, combinedEdges);
              
              setNodes(layout.nodes);
              setEdges(layout.edges);
            }
          }
        } catch (e) {
          console.error("Failed to expand node:", e);
        }
      }
    },
    [nodes, edges, data.nodes, data.edges, setNodes, setEdges, setCollapsedCases]
  );

  // Focus on a specific node
  const handleFocusNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setCenter(node.position.x + 90, node.position.y + 45, { zoom: 1.5, duration: 600 });
        const raw = data.nodes.find((n) => n.id === nodeId);
        if (raw) setSelectedNode(raw as GraphNode);
      }
    },
    [nodes, setCenter, data.nodes]
  );

  // Related nodes for sidebar
  const relatedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const connectedIds = new Set<string>();
    data.edges.forEach((e) => {
      if (e.source === selectedNode.id) connectedIds.add(e.target);
      if (e.target === selectedNode.id) connectedIds.add(e.source);
    });
    return data.nodes.filter((n) => connectedIds.has(n.id)) as GraphNode[];
  }, [selectedNode, data.edges, data.nodes]);

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  return (
    <div className="absolute inset-0 bg-slate-950">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        {/* Search */}
        <div className="pointer-events-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            id="graph-search"
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-44 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Layout Strategy Select */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-2 py-1">
          <span className="text-[10px] font-mono text-slate-400 pl-1">Layout:</span>
          <select
            value={layoutStrategy}
            onChange={(e) => setLayoutStrategy(e.target.value as LayoutStrategy)}
            className="bg-transparent border-none outline-none text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wide cursor-pointer focus:ring-0"
          >
            <option value="flat" className="bg-slate-900 text-slate-300">Flat</option>
            <option value="type" className="bg-slate-900 text-slate-300">Group by Type</option>
            <option value="case" className="bg-slate-900 text-slate-300">Group by Case</option>
          </select>
        </div>

        {/* Type filters */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-2 py-1">
          <Filter className="w-3 h-3 text-slate-500 mr-1" />
          {NODE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => toggleFilter(opt.type)}
              style={activeFilters.has(opt.type) ? { backgroundColor: opt.color + "30", borderColor: opt.color } : {}}
              className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-transparent hover:border-slate-600 text-slate-400 hover:text-white transition-all"
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="pointer-events-auto ml-auto flex items-center gap-3 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-3 py-1.5">
          <span className="text-[9px] font-mono text-slate-400">
            <span className="text-emerald-400 font-bold">{data.stats.total_nodes}</span> nodes
          </span>
          <span className="text-[9px] font-mono text-slate-400">
            <span className="text-blue-400 font-bold">{data.stats.total_edges}</span> edges
          </span>
          {data.stats.suspicious_count > 0 && (
            <button
              onClick={() => setShowAlerts((v) => !v)}
              className="flex items-center gap-1 text-[9px] font-mono text-red-400 font-bold animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" />
              {data.stats.suspicious_count} alerts
            </button>
          )}
        </div>
      </div>

      {/* Suspicious alerts panel */}
      <AnimatePresence>
        {showAlerts && data.suspicious_patterns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 z-10 w-72 bg-slate-900/95 backdrop-blur border border-red-500/30 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                  Suspicious Patterns
                </span>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-800">
              {data.suspicious_patterns.map((p) => (
                <div key={p.id} className="px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border font-mono ${
                      p.severity === "high" ? "text-red-400 bg-red-500/10 border-red-500/30"
                        : p.severity === "medium" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                        : "text-slate-400 bg-slate-500/10 border-slate-500/30"
                    }`}>
                      {p.severity}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">{p.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* React Flow canvas */}
      <ReactFlow
        nodes={visibleNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-slate-950"
        colorMode="dark"
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls
          position="bottom-right"
          className="!bg-slate-900 !border-slate-700 [&>button]:!bg-slate-900 [&>button]:!border-slate-700 [&>button]:!text-slate-400"
        />
        <MiniMap
          position="bottom-left"
          style={{ background: "#0f172a", border: "1px solid #1e293b" }}
          nodeColor={(n) => {
            const colorMap: Record<string, string> = {
              case: "#10b981", evidence: "#3b82f6", hash: "#a855f7",
              investigator: "#f59e0b", ip_address: "#ef4444", device: "#06b6d4",
            };
            return colorMap[n.type as string] || "#475569";
          }}
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>

      {/* Provenance sidebar */}
      {selectedNode && (
        <ProvenanceSidebar
          node={selectedNode}
          patterns={data.suspicious_patterns}
          onClose={() => setSelectedNode(null)}
          onFocusNode={handleFocusNode}
          relatedNodes={relatedNodes}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported wrapper — provides ReactFlowProvider
// ---------------------------------------------------------------------------

export default function EvidenceGraph({ data }: EvidenceGraphProps) {
  return (
    <ReactFlowProvider>
      <InnerGraph data={data} />
    </ReactFlowProvider>
  );
}
