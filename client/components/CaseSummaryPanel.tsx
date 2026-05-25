"use client";

import { CaseSummary } from "@/lib/types";

export default function CaseSummaryPanel({ caseData }: { caseData: CaseSummary }) {
  return (
    <div className="p-4 rounded-xl border bg-white shadow-sm">
      
      <h2 className="text-lg font-semibold">Case Summary</h2>

      <div className="mt-3 space-y-2 text-sm">
        <p><b>Case ID:</b> {caseData.caseId}</p>
        <p><b>File:</b> {caseData.filename}</p>
        <p><b>Hash:</b> {caseData.hashValue}</p>
        <p><b>Investigator:</b> {caseData.investigator}</p>
        <p><b>Status:</b> {caseData.status}</p>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium">Threat Score</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div
            className="h-2 rounded-full bg-red-500"
            style={{ width: `${caseData.threatScore}%` }}
          />
        </div>
      </div>

    </div>
  );
}