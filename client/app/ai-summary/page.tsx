"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Brain,
  Upload,
  ArrowLeft,
  Loader,
  Copy,
  Download,
  FileJson,
  Check,
  AlertTriangle,
  File,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CaseSummary {
  overview: string;
  keyFindings: string[];
  riskAssessment: string;
  suggestedNextSteps: string[];
}

interface CaseRecord {
  id: string;
  case_id: string;
  filename: string;
  hash_value: string;
  investigator: string;
  status: string;
  created_at: string;
  file_size?: string;
  notes?: string;
}

interface AnalysisResult {
  case_id: string;
  caseData: CaseRecord;
  forensicData: any;
  aiSummary: CaseSummary | string;
  timestamp: Date;
}

export default function AISummaryPage() {
  const { data: session } = useSession();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copyNotif, setCopyNotif] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Safe text renderer
  const safeText = (val: any): string => {
    if (val === null) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    return JSON.stringify(val);
  };

  const fetchAISummary = async (caseData: CaseRecord): Promise<CaseSummary | string> => {
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseData, type: "detailed" }),
      });
      const data = await response.json();
      return data.summary;
    } catch (err) {
      console.error("AI summary failed:", err);
      return "AI analysis unavailable";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setUploadProgress(Math.min(pct, 95));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const forensicData = JSON.parse(xhr.responseText);
          setUploadProgress(100);

          const caseData: CaseRecord = {
            id: forensicData.id || `UPLOAD-${Date.now()}`,
            case_id: forensicData.id || `UPLOAD-${Date.now()}`,
            filename: file.name,
            hash_value: forensicData.hash || "Pending",
            investigator: session?.user?.email || "Unknown",
            status: "Analyzed",
            created_at: new Date().toISOString(),
            file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            notes: `Auto-analyzed: ${file.name}`,
          };

          const aiSummary = await fetchAISummary(caseData);

          setAnalyses(prev => [
            {
              case_id: caseData.case_id,
              caseData,
              forensicData,
              aiSummary,
              timestamp: new Date(),
            },
            ...prev,
          ]);
        } catch {
          setError("Failed to parse analysis result.");
        }
      } else {
        setError("Forensic analysis failed. Please try again.");
      }
      setIsUploading(false);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = "";
    };

    xhr.onerror = () => {
      setError("Failed to analyze file. Please try again.");
      setIsUploading(false);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = "";
    };

    xhr.open("POST", "/api/analyze");
    xhr.send(formData);
  };

  const copySummary = (summary: CaseSummary | string) => {
    const text = typeof summary === "string"
      ? summary
      : `Overview:\n${summary.overview}\n\nKey Findings:\n${summary.keyFindings.join("\n")}\n\nRisk Assessment:\n${summary.riskAssessment}\n\nNext Steps:\n${summary.suggestedNextSteps.join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopyNotif("Copied!");
    setTimeout(() => setCopyNotif(null), 2000);
  };

  const downloadJSON = (analysis: AnalysisResult) => {
    const data = JSON.stringify(analysis, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis_${analysis.case_id}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (analysis: AnalysisResult) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const timestamp = new Date().toLocaleString();

    // Header
    doc.setFillColor(88, 28, 135); // Purple
    doc.rect(0, 0, pageWidth, 30, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("AI Forensic Analysis Report", 15, 20);

    // Case Info Box
    doc.setFillColor(230, 230, 250);
    doc.rect(15, 35, pageWidth - 30, 20, "F");
    doc.setTextColor(88, 28, 135);
    doc.setFontSize(10);
    doc.text(`Case ID: ${analysis.case_id}`, 20, 42);
    doc.text(`File: ${analysis.caseData.filename}`, 20, 50);

    let currentY = 60;

    // Forensic Data
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Forensic Data", 15, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 15, right: 15 },
      head: [["Property", "Value"]],
      body: [
        ["Case ID", safeText(analysis.forensicData.id)],
        ["Hash (SHA-256)", safeText(analysis.forensicData.hash).slice(0, 50) + "..."],
        ["File Size", safeText(analysis.forensicData.size)],
        ["Status", safeText(analysis.forensicData.status)],
        ["Analyst", analysis.caseData.investigator],
        ["Analysis Time", timestamp],
      ],
      theme: "striped",
      headStyles: {
        fillColor: [88, 28, 135],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // AI Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("AI-Powered Analysis", 15, currentY);
    currentY += 8;

    if (typeof analysis.aiSummary === "string") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(analysis.aiSummary, pageWidth - 30);
      doc.text(splitText, 15, currentY);
      currentY += splitText.length * 5 + 5;
    } else {
      // Overview
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 66, 159); // Blue
      doc.text("Overview", 15, currentY);
      currentY += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      const overviewLines = doc.splitTextToSize(analysis.aiSummary.overview, pageWidth - 30);
      doc.text(overviewLines, 15, currentY);
      currentY += overviewLines.length * 4 + 5;

      // Key Findings
      if (analysis.aiSummary.keyFindings?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(5, 150, 105); // Emerald
        doc.text("Key Findings", 15, currentY);
        currentY += 5;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        analysis.aiSummary.keyFindings.slice(0, 5).forEach((f) => {
          const findingLines = doc.splitTextToSize(`• ${safeText(f)}`, pageWidth - 30);
          doc.text(findingLines, 15, currentY);
          currentY += findingLines.length * 4 + 2;
        });
        currentY += 3;
      }

      // Risk Assessment
      doc.setFont("helvetica", "bold");
      doc.setTextColor(194, 65, 12); // Orange
      doc.text("Risk Assessment", 15, currentY);
      currentY += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const riskLines = doc.splitTextToSize(analysis.aiSummary.riskAssessment, pageWidth - 30);
      doc.text(riskLines, 15, currentY);
      currentY += riskLines.length * 4 + 5;

      // Suggested Next Steps
      if (analysis.aiSummary.suggestedNextSteps?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(67, 56, 202); // Indigo
        doc.text("Suggested Next Steps", 15, currentY);
        currentY += 5;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        analysis.aiSummary.suggestedNextSteps.slice(0, 5).forEach((s, i) => {
          const stepLines = doc.splitTextToSize(`${i + 1}. ${safeText(s)}`, pageWidth - 30);
          doc.text(stepLines, 15, currentY);
          currentY += stepLines.length * 4 + 2;
        });
      }
    }

    // Footer
    const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "AI Forensic Analysis - Confidential",
        15,
        pageHeight - 10
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - 30,
        pageHeight - 10
      );
    }

    doc.save(`analysis_${analysis.case_id}_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 px-6 py-6 sm:px-8">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link
              href="/dashboard"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-500" />
                AI Case Analysis
              </h1>
              <p className="text-xs text-slate-500 mt-1">Upload evidence for instant AI-powered analysis</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session?.user?.email && (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs font-mono text-red-500 hover:text-red-600 uppercase"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        {/* Upload Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900/50 dark:to-slate-900/30 border-2 border-dashed border-purple-300 dark:border-purple-700/50 rounded-2xl p-12 text-center"
        >
          <label className="block cursor-pointer group">
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isUploading
                  ? "bg-purple-200 dark:bg-purple-900/50"
                  : "bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50"
              }`}>
                {isUploading ? (
                  <Loader className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                )}
              </div>

              {isUploading && (
                <div className="w-full max-w-xs mx-auto">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Processing..."}
                  </p>
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Upload Evidence File
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Drag or click to select a file for forensic analysis and AI summarization
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 font-mono">
                  Supports: disk images (.dd, .img), memory dumps (.dmp), archives (.zip, .tar.gz), logs, pcap files, other(.pdf,.jpg,.png,.jpeg,.docx)
                </p>
              </div>
            </div>

            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              accept=".dd,.img,.bin,.zip,.tar,.gz,.pcap,.log,.dmp,.raw,.pdf,.jpg,.png,.jpeg,.docx"
            />
          </label>
        </motion.section>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-300 text-sm"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Results */}
        <AnimatePresence>
          {analyses.map((analysis, idx) => (
            <motion.div
              key={`${analysis.case_id}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {analysis.caseData.case_id}
                  </h2>
                  <p className="text-sm text-slate-500 font-mono">
                    {analysis.caseData.filename} • {analysis.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copySummary(analysis.aiSummary)}
                    title="Copy summary"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" />
                  </button>
                  <button
                    onClick={() => downloadPDF(analysis)}
                    title="Download as PDF"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <File className="w-4 h-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" />
                  </button>
                  <button
                    onClick={() => downloadJSON(analysis)}
                    title="Download as JSON"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <FileJson className="w-4 h-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Forensic Data */}
                <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-3 tracking-wide">
                    Forensic Data
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Case ID:</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {safeText(analysis.forensicData.id)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Hash:</span>
                      <span className="text-slate-900 dark:text-white truncate">
                        {safeText(analysis.forensicData.hash).slice(0, 20)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Size:</span>
                      <span className="text-slate-900 dark:text-white">{safeText(analysis.forensicData.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Status:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {safeText(analysis.forensicData.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="lg:col-span-2 space-y-4">
                  {typeof analysis.aiSummary === "string" ? (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-900/50">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysis.aiSummary}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Overview */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-900/50">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Overview</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {analysis.aiSummary.overview}
                        </p>
                      </div>

                      {/* Key Findings */}
                      {analysis.aiSummary.keyFindings?.length > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-900/50">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">
                            Key Findings
                          </p>
                          <ul className="space-y-2">
                            {analysis.aiSummary.keyFindings.map((f, i) => (
                              <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                                {safeText(f)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk Assessment */}
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-900/50">
                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-2">
                          Risk Assessment
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {analysis.aiSummary.riskAssessment}
                        </p>
                      </div>

                      {/* Suggested Next Steps */}
                      {analysis.aiSummary.suggestedNextSteps?.length > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-900/50">
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">
                            Suggested Next Steps
                          </p>
                          <ol className="space-y-2">
                            {analysis.aiSummary.suggestedNextSteps.map((s, i) => (
                              <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{i + 1}.</span>
                                {safeText(s)}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {analyses.length === 0 && !isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-slate-500 dark:text-slate-400">
              Upload a file to get started with AI-powered forensic analysis
            </p>
          </motion.div>
        )}

        {/* Copy Notification */}
        <AnimatePresence>
          {copyNotif && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-6 right-6 bg-emerald-500 text-white px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              <Check className="w-4 h-4" />
              {copyNotif}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
