"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  GitBranch,
  AlertTriangle,
  Activity,
  ChevronLeft,
  RefreshCw,
  Shield,
  FileText,
  Fingerprint,
  User,
  Globe,
  Monitor,
} from "lucide-react";

// Dynamically import graph (client-only, uses browser APIs)
const EvidenceGraph = dynamic(
  () => import("@/components/graph/EvidenceGraph"),
  { ssr: false, loading: () => <GraphSkeleton /> }
);

// ---------------------------------------------------------------------------
// Demo fallback data (mirrors Server/graph_engine.py DEMO_CASES output)
// ---------------------------------------------------------------------------

const DEMO_GRAPH_DATA = {
  nodes: [
    { id: "case-demo1042", type: "case",        label: "DEMO-1042", metadata: { case_id: "DEMO-1042", status: "Verified",        created_at: "2026-04-25T09:30:00Z" }, suspicious: false },
    { id: "case-demo2871", type: "case",        label: "DEMO-2871", metadata: { case_id: "DEMO-2871", status: "Pending Review",  created_at: "2026-04-24T16:10:00Z" }, suspicious: false },
    { id: "case-demo3920", type: "case",        label: "DEMO-3920", metadata: { case_id: "DEMO-3920", status: "Archived",        created_at: "2026-04-23T11:45:00Z" }, suspicious: false },
    { id: "ev-demo1042",   type: "evidence",    label: "disk_image.dd",          metadata: { filename: "disk_image.dd",          file_size: "4096 bytes" }, suspicious: false },
    { id: "ev-demo2871",   type: "evidence",    label: "network_capture.pcap",   metadata: { filename: "network_capture.pcap",   file_size: "2048 bytes" }, suspicious: false },
    { id: "ev-demo3920",   type: "evidence",    label: "mobile_backup.zip",      metadata: { filename: "mobile_backup.zip",      file_size: "8192 bytes" }, suspicious: false },
    { id: "hash-shared",   type: "hash",        label: "a81f3c72e9d4b05c...",    metadata: { full_hash: "a81f3c72e9d4b05c1f2a8e3d7b6c9f04", algorithm: "SHA256" }, suspicious: true },
    { id: "hash-2871",     type: "hash",        label: "b72c19fe0a3d81c5...",    metadata: { full_hash: "b72c19fe0a3d81c5e7f2b49d6c3e1a08", algorithm: "SHA256" }, suspicious: false },
    { id: "inv-admin",     type: "investigator",label: "admin@forensics.com",    metadata: { email: "admin@forensics.com" },  suspicious: false },
    { id: "inv-agent",     type: "investigator",label: "agent@forensics.com",    metadata: { email: "agent@forensics.com" },  suspicious: false },
    { id: "ip-shared",     type: "ip_address",  label: "192.168.14.22",          metadata: { ip: "192.168.14.22", source: "Derived from case metadata" }, suspicious: true },
    { id: "ip-2871",       type: "ip_address",  label: "10.0.44.91",             metadata: { ip: "10.0.44.91",   source: "Derived from case metadata" }, suspicious: false },
    { id: "dev-demo1042",  type: "device",      label: "DEV-A1B2C3D4",           metadata: { device_id: "DEV-A1B2C3D4" }, suspicious: false },
    { id: "dev-demo2871",  type: "device",      label: "DEV-E5F6G7H8",           metadata: { device_id: "DEV-E5F6G7H8" }, suspicious: false },
    { id: "dev-demo3920",  type: "device",      label: "DEV-I9J0K1L2",           metadata: { device_id: "DEV-I9J0K1L2" }, suspicious: false },
  ],
  edges: [
    { id: "e1",  source: "case-demo1042", target: "ev-demo1042",   relationship: "CONTAINS",         metadata: {} },
    { id: "e2",  source: "ev-demo1042",   target: "hash-shared",   relationship: "HAS_HASH",         metadata: {} },
    { id: "e3",  source: "case-demo1042", target: "inv-admin",     relationship: "ASSIGNED_TO",      metadata: {} },
    { id: "e4",  source: "case-demo1042", target: "ip-shared",     relationship: "ORIGINATED_FROM",  metadata: {} },
    { id: "e5",  source: "case-demo1042", target: "dev-demo1042",  relationship: "ACQUIRED_FROM",    metadata: {} },
    { id: "e6",  source: "case-demo2871", target: "ev-demo2871",   relationship: "CONTAINS",         metadata: {} },
    { id: "e7",  source: "ev-demo2871",   target: "hash-2871",     relationship: "HAS_HASH",         metadata: {} },
    { id: "e8",  source: "case-demo2871", target: "inv-admin",     relationship: "ASSIGNED_TO",      metadata: {} },
    { id: "e9",  source: "case-demo2871", target: "ip-2871",       relationship: "ORIGINATED_FROM",  metadata: {} },
    { id: "e10", source: "case-demo2871", target: "dev-demo2871",  relationship: "ACQUIRED_FROM",    metadata: {} },
    { id: "e11", source: "case-demo3920", target: "ev-demo3920",   relationship: "CONTAINS",         metadata: {} },
    { id: "e12", source: "ev-demo3920",   target: "hash-shared",   relationship: "HAS_HASH",         metadata: {} },
    { id: "e13", source: "case-demo3920", target: "inv-agent",     relationship: "ASSIGNED_TO",      metadata: {} },
    { id: "e14", source: "case-demo3920", target: "ip-shared",     relationship: "ORIGINATED_FROM",  metadata: {} },
    { id: "e15", source: "case-demo3920", target: "dev-demo3920",  relationship: "ACQUIRED_FROM",    metadata: {} },
    { id: "e16", source: "hash-shared",   target: "case-demo1042", relationship: "SHARED_INDICATOR", metadata: {} },
    { id: "e17", source: "hash-shared",   target: "case-demo3920", relationship: "SHARED_INDICATOR", metadata: {} },
    { id: "e18", source: "case-demo1042", target: "case-demo3920", relationship: "SHARED_IP",        metadata: { ip: "192.168.14.22" } },
  ],
  suspicious_patterns: [
    {
      id: "pat-dup-hash-shared",
      type: "duplicate_hash",
      severity: "high" as const,
      nodes: ["hash-shared"],
      cases: ["DEMO-1042", "DEMO-3920"],
      description: "Hash 'a81f3c72e9d4b05c...' is shared across 2 cases: DEMO-1042, DEMO-3920. This may indicate evidence duplication or tampering.",
    },
    {
      id: "pat-shared-ip",
      type: "shared_ip",
      severity: "medium" as const,
      nodes: ["ip-shared"],
      cases: ["DEMO-1042", "DEMO-3920"],
      description: "IP address '192.168.14.22' appears in 2 cases: DEMO-1042, DEMO-3920. Cross-case network activity detected.",
    },
  ],
  stats: {
    total_nodes: 15,
    total_edges: 18,
    suspicious_count: 2,
    cases_processed: 3,
  },
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function GraphSkeleton() {
  return (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto" />
        <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
          Building Relationship Graph...
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

const LEGEND_ITEMS = [
  { icon: <Shield className="w-3 h-3" />,      label: "Case",         color: "text-emerald-400" },
  { icon: <FileText className="w-3 h-3" />,    label: "Evidence",     color: "text-blue-400" },
  { icon: <Fingerprint className="w-3 h-3" />, label: "Hash",         color: "text-purple-400" },
  { icon: <User className="w-3 h-3" />,        label: "Investigator", color: "text-amber-400" },
  { icon: <Globe className="w-3 h-3" />,       label: "IP Address",   color: "text-red-400" },
  { icon: <Monitor className="w-3 h-3" />,     label: "Device",       color: "text-cyan-400" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EvidenceGraphPage() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<typeof DEMO_GRAPH_DATA | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/graph/relationships`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setGraphData(data);
      setIsDemo(false);
    } catch (err) {
      console.warn("Backend unavailable, using demo graph data:", err);
      setGraphData(DEMO_GRAPH_DATA);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md z-20 shrink-0"
      >
        <div className="flex items-center gap-4">
          <button
            id="back-to-dashboard"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-[11px] font-mono"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white font-mono tracking-tight">
                Evidence Provenance Graph
              </h1>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Relationship Intelligence Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Demo badge */}
          {isDemo && (
            <span className="text-[9px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
              Demo Data
            </span>
          )}

          {/* Live stats */}
          {graphData && (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-center">
                <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Nodes</p>
                <p className="text-sm font-mono font-bold text-emerald-400">{graphData.stats.total_nodes}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Edges</p>
                <p className="text-sm font-mono font-bold text-blue-400">{graphData.stats.total_edges}</p>
              </div>
              {graphData.stats.suspicious_count > 0 && (
                <div className="text-center">
                  <p className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Alerts</p>
                  <p className="text-sm font-mono font-bold text-red-400 animate-pulse">{graphData.stats.suspicious_count}</p>
                </div>
              )}
            </div>
          )}

          {/* Refresh */}
          <button
            id="refresh-graph"
            onClick={fetchGraph}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </motion.header>

      {/* Suspicious alert banner */}
      {graphData && graphData.stats.suspicious_count > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-3 px-6 py-2 bg-red-950/50 border-b border-red-500/20"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-[10px] font-mono text-red-300">
            <span className="font-bold">{graphData.stats.suspicious_count} suspicious pattern(s) detected</span>
            {" "}— Click the alert panel in the graph for details.
          </p>
        </motion.div>
      )}

      {/* Main graph area */}
      <div className="flex-1 relative overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center max-w-sm">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-mono text-white mb-2">Failed to load graph</p>
              <p className="text-[11px] text-slate-400 mb-4">{error}</p>
              <button onClick={fetchGraph} className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-[11px] font-mono font-bold uppercase">
                Retry
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <GraphSkeleton />
        ) : graphData ? (
          <EvidenceGraph data={graphData} />
        ) : null}
      </div>

      {/* Footer legend */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-4 px-6 py-3 border-t border-slate-800 bg-slate-950/90 backdrop-blur shrink-0"
      >
        <div className="flex items-center gap-1.5 mr-2">
          <Activity className="w-3 h-3 text-slate-500" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Legend</span>
        </div>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className={`flex items-center gap-1 ${item.color}`}>
            {item.icon}
            <span className="text-[9px] font-mono text-slate-400">{item.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3 text-[9px] font-mono text-slate-600">
          <span>Click node → provenance</span>
          <span>·</span>
          <span>Drag to rearrange</span>
          <span>·</span>
          <span>Scroll to zoom</span>
        </div>
      </motion.footer>
    </div>
  );
}
