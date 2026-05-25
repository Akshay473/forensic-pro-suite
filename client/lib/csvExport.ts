export type CsvColumn = "case_id" | "filename" | "hash_value" | "investigator" | "status" | "created_at";

export type CsvRecord = Record<CsvColumn, unknown>;

// As-const configuration freeze ensures compiler optimizations
const DEFAULT_COLUMNS = [
  "case_id",
  "filename",
  "hash_value",
  "investigator",
  "status",
  "created_at",
] as const satisfies readonly CsvColumn[];

const HEADER_LABELS: Record<CsvColumn, string> = {
  case_id: "Case ID",
  filename: "Filename",
  hash_value: "Hash Value",
  investigator: "Investigator",
  status: "Status",
  created_at: "Created At",
};

/**
 * Robust RFC 4180 compliant CSV value formatting with auto-escaping.
 */
export function formatCsvValue(value: unknown): string {
  if (value == null) return '""';
  
  // Safely handle nested objects/arrays to prevent "[object Object]" print bugs
  let text = typeof value === "object" ? JSON.stringify(value) : String(value);
  
  // RFC 4180 requirement: If quotes, commas, or line breaks exist, escape quotes and wrap in quotes
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  
  return `"${text}"`;
}

export function generateTimestampedFilename(type: "case" | "demo"): string {
  const dateStr = new Date().toISOString().split("T")[0]; // Faster substring operation
  return `forensic-${type}-records-${dateStr}.csv`;
}

export function exportCasesToCSV<T extends CsvRecord>(
  records: T[], 
  type: "case" | "demo" = "case"
): void {
  if (!records?.length) {
    throw new Error("No data records available for CSV serialization extraction.");
  }

  // Pre-generate headers configuration row mapping
  const headerLine = DEFAULT_COLUMNS.map((col) => HEADER_LABELS[col]).join(",");

  // High-performance sorting using pre-compiled epoch evaluation mapping timestamps
  const sortedRecords = [...records].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at as string | number).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at as string | number).getTime() : 0;
    return bTime - aTime;
  });

  // Efficient bulk string processing matrix arrays
  const rows = sortedRecords.map((record) =>
    DEFAULT_COLUMNS.map((column) => formatCsvValue(record[column])).join(",")
  );

  // Prepend explicit Byte Order Mark (\uFEFF) to make Excel read encoding UTF-8 correctly
  const csvContent = `\uFEFF${[headerLine, ...rows].join("\r\n")}`;
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Resilient declarative trigger deployment routine
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = generateTimestampedFilename(type);
  anchor.style.setProperty("display", "none");
  
  document.body.appendChild(anchor);
  anchor.click();
  
  // Instantly cleanup DOM overhead
  document.body.removeChild(anchor);
  
  // Safe async garbage disposal cleanup for browser memory optimization
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
