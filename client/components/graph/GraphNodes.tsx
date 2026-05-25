"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Shield,
  FileText,
  Fingerprint,
  User,
  Globe,
  Monitor,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Shared node shell
// ---------------------------------------------------------------------------

interface NodeShellProps {
  color: string;       // Tailwind border/glow color key
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  suspicious?: boolean;
}

// Static color maps to prevent Tailwind purging
const COLOR_CLASSES: Record<string, { border: string; hoverBorder: string; shadowHover: string; bgHover: string; text: string }> = {
  emerald: { border: "border-emerald-500/40", hoverBorder: "hover:border-emerald-400", shadowHover: "hover:shadow-emerald-500/30", bgHover: "group-hover:bg-emerald-500/5", text: "text-emerald-400" },
  blue: { border: "border-blue-500/40", hoverBorder: "hover:border-blue-400", shadowHover: "hover:shadow-blue-500/30", bgHover: "group-hover:bg-blue-500/5", text: "text-blue-400" },
  purple: { border: "border-purple-500/40", hoverBorder: "hover:border-purple-400", shadowHover: "hover:shadow-purple-500/30", bgHover: "group-hover:bg-purple-500/5", text: "text-purple-400" },
  amber: { border: "border-amber-500/40", hoverBorder: "hover:border-amber-400", shadowHover: "hover:shadow-amber-500/30", bgHover: "group-hover:bg-amber-500/5", text: "text-amber-400" },
  red: { border: "border-red-500/40", hoverBorder: "hover:border-red-400", shadowHover: "hover:shadow-red-500/30", bgHover: "group-hover:bg-red-500/5", text: "text-red-400" },
  cyan: { border: "border-cyan-500/40", hoverBorder: "hover:border-cyan-400", shadowHover: "hover:shadow-cyan-500/30", bgHover: "group-hover:bg-cyan-500/5", text: "text-cyan-400" },
};

function NodeShell({ color, icon, label, sublabel, badge, badgeColor, suspicious }: NodeShellProps) {
  const styles = COLOR_CLASSES[color] || COLOR_CLASSES["emerald"];
  
  return (
    <div
      className={`
        relative min-w-[140px] max-w-[180px] rounded-xl border bg-slate-900/90
        backdrop-blur-sm px-3 py-2.5 shadow-lg transition-all duration-200
        group cursor-pointer
        ${suspicious ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] shadow-md" : styles.border}
        ${styles.hoverBorder} ${styles.shadowHover} hover:shadow-md
      `}
    >
      {/* Suspicious pulse ring */}
      {suspicious && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-red-800" />
        </span>
      )}

      {/* Glow overlay on hover */}
      <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 ${styles.bgHover}`} />

      <div className="flex items-start gap-2 relative z-10">
        <div className={`mt-0.5 shrink-0 ${styles.text}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-mono font-bold truncate leading-tight ${suspicious ? 'text-red-400' : 'text-white'}`}>{label}</p>
          {sublabel && <p className="text-[9px] text-slate-400 font-mono truncate mt-0.5">{sublabel}</p>}
          {badge && (
            <span className={`inline-block mt-1 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border font-mono ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* React Flow handles */}
      <Handle type="target" position={Position.Top}    className="!bg-slate-600 !w-2 !h-2 !border-slate-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-600 !w-2 !h-2 !border-slate-500" />
      <Handle type="target" position={Position.Left}   className="!bg-slate-600 !w-2 !h-2 !border-slate-500" />
      <Handle type="source" position={Position.Right}  className="!bg-slate-600 !w-2 !h-2 !border-slate-500" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "verified") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (s === "pending" || s === "pending review") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  if (s === "archived") return "text-slate-400 bg-slate-700/30 border-slate-600/30";
  return "text-slate-400 bg-slate-700/30 border-slate-600/30";
}

// ---------------------------------------------------------------------------
// Individual node types
// ---------------------------------------------------------------------------

export const CaseNode = memo(({ data }: NodeProps) => {
  const meta = (data.metadata as Record<string, string>) || {};
  return (
    <NodeShell
      color="emerald"
      icon={<Shield className="w-4 h-4" />}
      label={data.label as string}
      sublabel={meta.created_at ? new Date(meta.created_at).toLocaleDateString() : undefined}
      badge={meta.status}
      badgeColor={statusBadge(meta.status)}
      suspicious={!!data.suspicious}
    />
  );
});
CaseNode.displayName = "CaseNode";

export const EvidenceNode = memo(({ data }: NodeProps) => {
  const meta = (data.metadata as Record<string, string>) || {};
  return (
    <NodeShell
      color="blue"
      icon={<FileText className="w-4 h-4" />}
      label={data.label as string}
      sublabel={meta.file_size || meta.case_id}
      suspicious={!!data.suspicious}
    />
  );
});
EvidenceNode.displayName = "EvidenceNode";

export const HashNode = memo(({ data }: NodeProps) => {
  const meta = (data.metadata as Record<string, string>) || {};
  return (
    <NodeShell
      color="purple"
      icon={<Fingerprint className="w-4 h-4" />}
      label={data.label as string}
      sublabel={meta.algorithm}
      suspicious={!!data.suspicious}
    />
  );
});
HashNode.displayName = "HashNode";

export const InvestigatorNode = memo(({ data }: NodeProps) => {
  return (
    <NodeShell
      color="amber"
      icon={<User className="w-4 h-4" />}
      label={data.label as string}
      suspicious={!!data.suspicious}
    />
  );
});
InvestigatorNode.displayName = "InvestigatorNode";

export const IPNode = memo(({ data }: NodeProps) => {
  return (
    <NodeShell
      color="red"
      icon={<Globe className="w-4 h-4" />}
      label={data.label as string}
      sublabel="Network Origin"
      suspicious={!!data.suspicious}
    />
  );
});
IPNode.displayName = "IPNode";

export const DeviceNode = memo(({ data }: NodeProps) => {
  return (
    <NodeShell
      color="cyan"
      icon={<Monitor className="w-4 h-4" />}
      label={data.label as string}
      sublabel="Acquired Device"
      suspicious={!!data.suspicious}
    />
  );
});
DeviceNode.displayName = "DeviceNode";

export const GroupNode = memo(({ data }: NodeProps) => {
  return (
    <div className="w-full h-full rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/20 backdrop-blur-sm relative pointer-events-none">
      {Boolean(data.label) ? (
        <div className="absolute -top-3 left-4 bg-slate-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
          {data.label as string}
        </div>
      ) : null}
    </div>
  );
});
GroupNode.displayName = "GroupNode";

// ---------------------------------------------------------------------------
// Node type registry for React Flow
// ---------------------------------------------------------------------------

export const nodeTypes = {
  case: CaseNode,
  evidence: EvidenceNode,
  hash: HashNode,
  investigator: InvestigatorNode,
  ip_address: IPNode,
  device: DeviceNode,
  group: GroupNode,
};
