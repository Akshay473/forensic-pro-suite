"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  FileText,
  Fingerprint,
  User,
  Globe,
  Monitor,
  X,
  AlertTriangle,
  Link,
  Clock,
  Download,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  metadata: Record<string, string | undefined>;
  suspicious?: boolean;
}

export interface SuspiciousPattern {
  id: string;
  type: string;
  severity: "high" | "medium" | "low";
  nodes: string[];
  cases: string[];
  description: string;
}

export interface ProvenanceStep {
  step: number;
  event: string;
  timestamp: string;
  actor: string;
  detail: string;
}

export interface ProvenanceData {
  case_id: string;
  filename: string;
  hash: string;
  investigator: string;
  status: string;
  chain: ProvenanceStep[];
}

interface ProvenanceSidebarProps {
  node: GraphNode | null;
  patterns: SuspiciousPattern[];
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
  relatedNodes: GraphNode[];
}

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ReactNode> = {
  case: <Shield className="w-4 h-4" />,
  evidence: <FileText className="w-4 h-4" />,
  hash: <Fingerprint className="w-4 h-4" />,
  investigator: <User className="w-4 h-4" />,
  ip_address: <Globe className="w-4 h-4" />,
  device: <Monitor className="w-4 h-4" />,
};

const COLOR_MAP: Record<string, string> = {
  case: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  evidence: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  hash: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  investigator: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  ip_address: "text-red-400 bg-red-500/10 border-red-500/30",
  device: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
};

const SEVERITY_COLOR: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/30",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low: "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

// ---------------------------------------------------------------------------
// Provenance timeline step
// ---------------------------------------------------------------------------

function ProvenanceStepItem({ step }: { step: ProvenanceStep }) {
  return (
    <div className="relative flex gap-3">
      {/* Connector line */}
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-mono font-bold text-emerald-400">{step.step}</span>
        </div>
        <div className="w-px flex-1 bg-slate-800 mt-1" />
      </div>

      <div className="pb-4 min-w-0">
        <p className="text-[11px] font-bold text-white font-mono">{step.event}</p>
        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{step.detail}</p>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="w-2.5 h-2.5 text-slate-500" />
          <span className="text-[9px] text-slate-500 font-mono">
            {step.actor} · {new Date(step.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main sidebar component
// ---------------------------------------------------------------------------

export default function ProvenanceSidebar({
  node,
  patterns,
  onClose,
  onFocusNode,
  relatedNodes,
}: ProvenanceSidebarProps) {
  if (!node) return null;

  const nodePatterns = patterns.filter((p) => p.nodes.includes(node.id));
  const colorClass = COLOR_MAP[node.type] || COLOR_MAP.case;
  const icon = ICON_MAP[node.type] || <FileText className="w-4 h-4" />;

  const [provenanceChain, setProvenanceChain] = React.useState<ProvenanceStep[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!node) return;
    
    const nodePatterns = patterns.filter((p) => p.nodes.includes(node.id));
    const fallbackChain: ProvenanceStep[] = [
      {
        step: 1,
        event: "Entity Discovered",
        timestamp: node.metadata.created_at || new Date().toISOString(),
        actor: "Forensic Engine",
        detail: `${node.type.replace("_", " ")} entity '${node.label}' extracted from case data.`,
      },
      {
        step: 2,
        event: "Relationship Mapped",
        timestamp: node.metadata.created_at || new Date().toISOString(),
        actor: "Relationship Engine",
        detail: `${relatedNodes.length} relationship(s) established with connected entities.`,
      },
      ...(nodePatterns.length > 0
        ? [
            {
              step: 3,
              event: "Suspicious Pattern Detected",
              timestamp: new Date().toISOString(),
              actor: "Intelligence Engine",
              detail: `${nodePatterns.length} suspicious indicator(s) flagged for review.`,
            },
          ]
        : []),
    ];

    const caseIdRaw = node.type === "case" ? node.id.replace("case-", "") : node.metadata.case_id || node.metadata.id;
    const caseId = caseIdRaw ? String(caseIdRaw).replace("case-", "") : null;

    if (!caseId) {
      setProvenanceChain(fallbackChain);
      return;
    }

    setLoading(true);
    fetch(`/api/graph/provenance/${caseId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.chain) {
          setProvenanceChain(data.chain);
        } else {
          setProvenanceChain(fallbackChain);
        }
      })
      .catch(err => {
        console.error("Failed to fetch provenance", err);
        setProvenanceChain(fallbackChain);
      })
      .finally(() => setLoading(false));
  }, [node, patterns, relatedNodes.length]);

  return (
    <AnimatePresence>
      <motion.aside
        key="sidebar"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 h-full w-[300px] bg-slate-950/95 border-l border-slate-800 backdrop-blur-md flex flex-col z-50 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {node.type.replace("_", " ")}
            </p>
            <p className="text-sm font-mono font-bold text-white truncate">{node.label}</p>
          </div>
          <button
            onClick={onClose}
            id="close-provenance-sidebar"
            className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Suspicious warnings */}
          {nodePatterns.length > 0 && (
            <section>
              <h3 className="text-[9px] font-mono uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Suspicious Indicators
              </h3>
              <div className="space-y-2">
                {nodePatterns.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border font-mono ${SEVERITY_COLOR[p.severity]}`}>
                        {p.severity}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{p.type.replace("_", " ")}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Metadata */}
          <section>
            <h3 className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">Metadata</h3>
            <div className="space-y-1.5">
              {Object.entries(node.metadata)
                .filter(([, value]) => value !== undefined && value !== "")
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-mono text-slate-500 capitalize shrink-0">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 text-right break-all max-w-[160px]">
                      {String(value)}
                    </span>
                  </div>
                ))}
            </div>
          </section>

          {/* Related nodes */}
          {relatedNodes.length > 0 && (
            <section>
              <h3 className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                <Link className="w-3 h-3" /> Connected Entities ({relatedNodes.length})
              </h3>
              <div className="space-y-1.5">
                {relatedNodes.map((rn) => {
                  const rc = COLOR_MAP[rn.type] || COLOR_MAP.case;
                  return (
                    <button
                      key={rn.id}
                      onClick={() => onFocusNode(rn.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all hover:bg-slate-800 text-left ${rc}`}
                    >
                      <span className="shrink-0">{ICON_MAP[rn.type]}</span>
                      <span className="text-[10px] font-mono text-slate-300 truncate flex-1">{rn.label}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Provenance chain */}
          <section>
            <h3 className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Provenance Chain
            </h3>
            <div>
              {provenanceChain.map((step) => (
                <ProvenanceStepItem key={step.step} step={step} />
              ))}
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 flex gap-2">
          <button
            id="focus-node-btn"
            onClick={() => onFocusNode(node.id)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
          >
            <ChevronRight className="w-3 h-3" /> Focus
          </button>
          <button
            id="export-provenance-btn"
            onClick={() => {
              const blob = new Blob([JSON.stringify({ node, patterns: nodePatterns, provenance: provenanceChain }, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `provenance-${node.id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
