export interface CaseSummary {
  caseId: string;
  filename: string;
  hashValue: string;
  investigator: string;
  status: "Neutral" | "Elevated" | "Critical";
  createdAt: string;

  // NEW forensic insights
  threatScore: number; // 0–100
  suspiciousIndicators: string[];

  metadata: {
    size?: number;
    lastModified?: string;
    lastAccessed?: string;
  };
}