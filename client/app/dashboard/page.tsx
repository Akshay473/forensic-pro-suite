"use client";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import RobotAssistant from "@/components/RobotAssistant";
import ForensicTerminal from "@/components/Terminal";
import ForensicMap from "@/components/ForensicMap";
import AnalysisLogs from "@/components/AnalysisLogs";
import { supabase } from "@/lib/supabase";
import { generateForensicReport } from "@/lib/reportGenerator";

interface CaseRecord {
  id: string;
  case_id: string;
  filename: string;
  hash_value: string;
  investigator: string;
  status: string;
  created_at: string;
}

interface AnalysisResult {
  id: string;
  filename: string;
  hash: string;
  size: string;
  status: string;
}

function buildChartData(cases: CaseRecord[]) {
  const counts: Record<string, number> = {};
  cases.forEach((c) => {
    const day = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    counts[day] = (counts[day] || 0) + 1;
  });
  return Object.entries(counts)
    .slice(-7)
    .map(([date, count]) => ({ date, count }));
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [caseHistory, setCaseHistory] = useState<CaseRecord[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const forensicTools = [
    { name: "EnCase", cat: "Disk Analysis", icon: "🔍", id: "tool-encase" },
    { name: "Wireshark", cat: "Network Packets", icon: "🦈", id: "tool-wireshark" },
    { name: "Autopsy", cat: "Digital Investigation", icon: "💀", id: "tool-autopsy" },
    { name: "FTK Imager", cat: "Evidence Acquisition", icon: "💾", id: "tool-ftk-imager" },
    { name: "Data Recovery", cat: "Recuva / Stellar", icon: "📂", id: "tool-data-recovery" },
    { name: "Automated Flow", cat: "End-to-End AI", icon: "⚡", special: true, id: "tool-automated-flow" },
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setFetchError("Failed to load case records. Check your Supabase connection.");
      } else {
        setFetchError(null);
        setCaseHistory(data as CaseRecord[]);
      }
    };
    fetchHistory();
  }, [analysisResult]);

  const runAutomatedFlow = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/analyze`, {
          method: "POST",
          body: formData,
        });
        const data: AnalysisResult = await response.json();

        const { error } = await supabase.from("cases").insert([
          {
            case_id: data.id,
            filename: file.name,
            hash_value: data.hash,
            investigator: session?.user?.email || "Unknown Agent",
            status: "Verified",
          },
        ]);

        if (!error) setAnalysisResult(data);
      } catch {
        setAnalysisResult({
          id: `DEMO-${Math.floor(Math.random() * 1000)}`,
          filename: file.name,
          hash: "SHA256: 7e8a...3f12",
          size: "N/A",
          status: "Offline Report",
        });
      } finally {
        setTimeout(() => setIsAnalyzing(false), 2000);
      }
    };
    input.click();
  };

  const chartData = buildChartData(caseHistory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <header className="flex justify-between items-start mb-10 border-b border-slate-800 pb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Workstation:{" "}
            <span className="text-emerald-400 font-mono">
              AGENT_{session?.user?.name?.toUpperCase() || "INTEL"}
            </span>
          </h1>
          <p className="text-slate-500 text-[10px] mt-1 font-mono uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Status: Monitoring Global Threats
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
            <p className="text-[8px] uppercase text-slate-500 font-bold tracking-widest mb-1">Archive Size</p>
            <p className="text-xl font-mono text-emerald-400">{caseHistory.length}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              {session?.user?.name?.[0] || "A"}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-300 truncate max-w-[100px]">
                {session?.user?.email}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem("forensic_robot_step");
                  signOut({ callbackUrl: "/" });
                }}
                className="text-[9px] text-red-400 hover:text-red-300 text-left font-mono uppercase tracking-tighter transition-colors"
              >
                Terminate_Session
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forensicTools.map((tool, index) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                id={tool.id}
                onClick={tool.special ? runAutomatedFlow : undefined}
                className={`bg-slate-900 border ${tool.special ? "border-emerald-500/50" : "border-slate-800"} p-4 rounded-xl cursor-pointer hover:bg-slate-800 transition-all relative overflow-hidden group min-h-[120px]`}
              >
                {tool.special && isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-slate-900/95 z-20 p-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest font-mono">
                        Analyzing Artifacts...
                      </span>
                    </div>
                    <AnalysisLogs />
                  </motion.div>
                )}
                <div className="text-2xl mb-2">{tool.icon}</div>
                <h3 className="text-sm font-bold text-white">{tool.name}</h3>
                <p className="text-[10px] text-slate-500">{tool.cat}</p>
              </motion.div>
            ))}
          </section>

          <ForensicMap />

          {/* Case Volume Chart */}
          {chartData.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
            >
              <h2 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-6">
                Case Volume (Last 7 Days)
              </h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={20}>
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#10b981" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#10b981" opacity={0.7 + i * 0.04} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.section>
          )}

          {/* Database Records */}
          <motion.section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-6">
              Database Records
            </h2>

            {fetchError && (
              <p className="text-red-400 text-xs font-mono mb-4 border border-red-500/20 bg-red-500/10 rounded-lg px-3 py-2">
                ⚠ {fetchError}
              </p>
            )}

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              <AnimatePresence>
                {caseHistory.map((item) => (
                  <motion.div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-[12px] group hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500 opacity-50 font-mono">ID_{item.case_id?.slice(0, 5)}</span>
                      <span className="font-mono text-slate-300 truncate max-w-[150px]">{item.filename}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 font-mono text-[10px] hidden md:block">
                        {item.hash_value.slice(0, 16)}...
                      </span>
                      <button
                        onClick={() => generateForensicReport(item)}
                        className="opacity-0 group-hover:opacity-100 transition-all bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-3 py-1 rounded border border-emerald-500/20 text-[10px] font-bold uppercase"
                      >
                        Export PDF
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-6">
            <ForensicTerminal />
            <div className="mt-6">
              <RobotAssistant />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
