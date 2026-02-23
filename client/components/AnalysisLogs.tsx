"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const forensicEvents = [
  "[SYSTEM] Initializing forensic pipeline...",
  "[AUTH] Validating investigator credentials...",
  "[DISK] Checking file system integrity...",
  "[HASH] Calculating SHA-256 checksum...",
  "[METADATA] Extracting EXIF and system artifacts...",
  "[GEO] Determining triage node location...",
  "[SUCCESS] Analysis complete. Vaulting record."
];

export default function AnalysisLogs() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < forensicEvents.length) {
        setLogs((prev) => [...prev, forensicEvents[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/80 border border-emerald-500/30 rounded-lg p-3 font-mono text-[10px] space-y-1 h-32 overflow-hidden shadow-2xl">
      {logs.map((log, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className={log.includes("SUCCESS") ? "text-emerald-400" : "text-slate-400"}
        >
          {log}
        </motion.div>
      ))}
    </div>
  );
}