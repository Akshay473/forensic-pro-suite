"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Trash2 } from "lucide-react";

const SIMULATED_LOGS = [
  { text: "INCOMING: Automated SHA-256 integrity check initiated...", category: "network" },
  { text: "DEEP_SCAN: Magic numbers identified as 0x89 0x50 0x4E 0x47 (PNG Signature)", category: "system" },
  { text: "INTEGRITY: Dual-hash MD5 verification completed. Match found.", category: "system" },
  { text: "THREAT_INTEL: Cross-referencing findings with Global Signature Database...", category: "alerts" },
  { text: "STATUS: Threat level determined: NEUTRAL.", category: "system" },
  { text: "REPORT: Chain-of-custody documentation generated.", category: "system" },
  { text: "ALERT: New forensic artifact detected in volatility buffer.", category: "alerts" },
  { text: "NETWORK: Connection attempt from unauthorized IP range 192.168.1.105 blocked.", category: "network" },
  { text: "SYSTEM: Kernel integrity verified. No rootkits detected.", category: "system" },
  { text: "CORE_ENGINE: Heuristic analysis complete. No obfuscation found.", category: "system" }
];

interface LogItem {
  id: string;
  time: string;
  text: string;
  category: string;
}

export default function ThreatIntelligenceFeed() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Generate initial logs for better initial UX
    const initialLogs: LogItem[] = [];
    for (let i = 0; i < 6; i++) {
      const randomLog = SIMULATED_LOGS[Math.floor(Math.random() * SIMULATED_LOGS.length)];
      const date = new Date(Date.now() - (6 - i) * 10000);
      initialLogs.unshift({
        id: `${date.getTime()}-${Math.random()}`,
        time: date.toLocaleTimeString([], { hour12: false }),
        text: randomLog.text,
        category: randomLog.category,
      });
    }
    setLogs(initialLogs);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const randomLog = SIMULATED_LOGS[Math.floor(Math.random() * SIMULATED_LOGS.length)];
        const newLog: LogItem = {
          id: `${Date.now()}-${Math.random()}`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
          text: randomLog.text,
          category: randomLog.category,
        };
        const next = [newLog, ...prev];
        return next.slice(0, 30); // Keep up to 30 logs in buffer
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredLogs = logs.filter(log => filter === "all" || log.category === filter).slice(0, 8);

  return (
    <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-emerald-500/20 rounded-2xl p-5 font-mono shadow-sm transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          Live Threat Intel
        </h3>
        
        {/* Interactive Controls */}
        <div className="flex items-center gap-2">
          {/* Category Filters */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-0.5 shadow-inner">
            {["all", "alerts", "system", "network"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-all ${
                  filter === cat
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-slate-500 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Play/Pause Stream */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-500 cursor-pointer transition-colors"
            title={isPaused ? "Resume Stream" : "Pause Stream"}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Clear Logs */}
          <button
            onClick={() => setLogs([])}
            className="p-1 rounded bg-slate-100 dark:bg-slate-950 hover:bg-red-500/10 hover:border-red-500/20 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-500 cursor-pointer transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-2 min-h-40">
        <AnimatePresence initial={false}>
          {filteredLogs.map((log) => (
            <motion.p
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-[9px] text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-3 leading-relaxed"
            >
              <span className="text-emerald-600 dark:text-emerald-500 mr-2">[{log.time}]</span>
              <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded border mr-2 font-bold font-mono inline-block text-center w-14 ${
                log.category === "alerts" ? "text-red-500 bg-red-500/5 dark:bg-red-500/10 border-red-500/20"
                  : log.category === "network" ? "text-blue-500 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20"
                  : "text-slate-500 bg-slate-500/5 dark:bg-slate-500/10 border-slate-500/20"
              }`}>
                {log.category}
              </span>
              {log.text}
            </motion.p>
          ))}
          {filteredLogs.length === 0 && (
            <p className="text-[9px] text-slate-500 italic text-center py-10">No matching logs in buffer. Uplink active...</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
