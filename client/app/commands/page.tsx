"use client";
import { useState } from "react";
import { 
  Copy, 
  Check, 
  ChevronLeft, 
  Shield, 
  Command, 
  BookOpen, 
  Search,
  Activity,
  Cpu,
  Lock,
  Globe
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";

interface CommandDetail {
  cmd: string;
  desc: string;
  usage: string;
  output: string;
  category: "Filesystem" | "Network" | "Memory" | "System";
}

const forensicCommands: CommandDetail[] = [
  { 
    cmd: "help", 
    desc: "The primary entry point for all investigator queries.", 
    usage: "help [command]", 
    output: "Lists all available commands and their syntax.",
    category: "System" 
  },
  { 
    cmd: "autopsy", 
    desc: "Digital forensics platform and graphical interface to The Sleuth Kit.", 
    usage: "autopsy --cli --image disk.dd", 
    output: "Initializes partition analysis and file system triage.",
    category: "Filesystem" 
  },
  { 
    cmd: "wireshark --cli", 
    desc: "Network protocol analyzer for live traffic simulation.", 
    usage: "wireshark --cli --interface eth0", 
    output: "Starts a real-time stream of packet headers and threat markers.",
    category: "Network" 
  },
  { 
    cmd: "vol.py", 
    desc: "The Volatility Framework for advanced memory forensics.", 
    usage: "vol.py -f memory.dmp windows.info", 
    output: "Extracts OS version, running processes, and kernel metadata.",
    category: "Memory" 
  },
  { 
    cmd: "fls", 
    desc: "List file and directory names in a disk image (Sleuth Kit).", 
    usage: "fls -r -o 2048 disk.dd", 
    output: "Hierarchical listing of all files, including deleted entries.",
    category: "Filesystem" 
  },
  { 
    cmd: "mactime", 
    desc: "Create an ASCII timeline of file activity.", 
    usage: "mactime -b body.txt 2026-01-01", 
    output: "Temporal visualization of MAC (Modified, Accessed, Changed) times.",
    category: "Filesystem" 
  },
  { 
    cmd: "sha256sum", 
    desc: "Compute and check SHA256 message digest.", 
    usage: "sha256sum artifact.ev1", 
    output: "Unique 64-character hash for chain-of-custody verification.",
    category: "System" 
  },
  { 
    cmd: "netstat -ano", 
    desc: "Display active network connections and listening ports.", 
    usage: "netstat -ano", 
    output: "List of PIDs and their associated network sockets.",
    category: "Network" 
  }
];

export default function CommandReference() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const filteredCommands = forensicCommands.filter(c => 
    c.cmd.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 transition-colors group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Workstation</span>
          </Link>
          <div className="flex items-center gap-2 text-emerald-500 font-bold">
            <Shield className="w-5 h-5" />
            <span className="uppercase text-sm tracking-tighter font-black">Forensic Pro</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6"
          >
            <BookOpen className="w-3 h-3" />
            Official Command Reference
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-6"
          >
            Investigator <span className="text-emerald-500">Toolkit</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Comprehensive syntax guide for the industry-standard forensic tools simulated within the Forensic Pro Suite environment. Lowering the barrier for entry in digital investigations.
          </motion.p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-16">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search commands or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
          />
        </div>

        {/* Commands Grid */}
        <div className="grid grid-cols-1 gap-6">
          {filteredCommands.map((item, index) => (
            <motion.div
              key={item.cmd}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-all shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                      {item.category}
                    </span>
                    <h3 className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {item.cmd}
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Command className="w-3 h-3" /> Standard Usage
                      </p>
                      <code className="text-xs text-slate-900 dark:text-slate-100 font-mono break-all">
                        {item.usage}
                      </code>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Simulation Output
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.output}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(item.cmd)}
                  className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  {copiedCmd === item.cmd ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Syntax
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Methodology Footer */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Lock className="w-5 h-5" />, title: "Chain of Custody", desc: "Every command usage is logged with time-stamped investigator attribution." },
            { icon: <Globe className="w-5 h-5" />, title: "Global Sync", desc: "Simulation datasets are synchronized with the live threat intelligence feed." },
            { icon: <Cpu className="w-5 h-5" />, title: "Automated Flow", desc: "Complex triage sequences can be automated via the dashboard 'Flow' trigger." },
          ].map((feature, i) => (
            <div key={i} className="text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mx-auto">
                {feature.icon}
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest">{feature.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
