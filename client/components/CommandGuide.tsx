"use client";
import { useState } from "react";
import { Terminal, Copy, Check, Info, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CommandItem {
  cmd: string;
  desc: string;
}

const commands: CommandItem[] = [
  { cmd: "help", desc: "View all available forensic commands" },
  { cmd: "autopsy", desc: "Initialize Sleuth Kit for disk analysis" },
  { cmd: "wireshark --cli", desc: "Start network packet triage simulation" },
  { cmd: "vol.py --info", desc: "Run Volatility memory forensics scan" },
  { cmd: "fls disk.dd", desc: "List files and directories from an image" },
  { cmd: "mactime", desc: "Generate temporal evidence timeline" },
  { cmd: "clear", desc: "Flush the terminal buffer" },
];

export default function CommandGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Terminal className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
            Investigator Reference
          </h2>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Quick-start terminal commands</p>
        </div>
      </div>

      <div className="space-y-2">
        {commands.map((item, index) => (
          <div 
            key={item.cmd}
            className="group flex flex-col p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <code className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded">
                {item.cmd}
              </code>
              <button
                onClick={() => copyToClipboard(item.cmd, index)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-colors"
                title="Copy Command"
              >
                {copiedIndex === index ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-600 dark:text-amber-400/80 leading-relaxed uppercase tracking-wider font-bold">
            Note: These commands simulate industry-standard forensic tools.
          </p>
        </div>

        <Link 
          href="/commands" 
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 transition-all text-[10px] font-bold uppercase tracking-widest group"
        >
          Explore All Commands
          <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
