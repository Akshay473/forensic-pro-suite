export type CsvColumn = "case_id" | "filename" | "hash_value" | "investigator" | "status" | "created_at";

export type CsvRecord = Record<CsvColumn, unknown>;

const defaultColumns: CsvColumn[] = [
  "case_id",
  "filename",
  "hash_value",
  "investigator",
  "status",
  "created_at",
];

const headerLabels: Record<CsvColumn, string> = {
  case_id: "Case ID",
  filename: "Filename",
  hash_value: "Hash Value",
  investigator: "Investigator",
  status: "Status",
  created_at: "Created At",
};

export function formatCsvValue(value: unknown) {
  const text = value == null ? "" : String(value);
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function generateTimestampedFilename(type: "case" | "demo") {
  const date = new Date().toISOString().slice(0, 10);
  return type === "demo"
    ? `forensic-demo-records-${date}.csv`
    : `forensic-case-records-${date}.csv`;
}

export function exportCasesToCSV<T extends CsvRecord>(records: T[], type: "case" | "demo" = "case") {
  if (!records || records.length === 0) {
    throw new Error("No records provided for CSV export.");
  }

  const headers = defaultColumns;
  const headerLine = headers.map((column) => headerLabels[column]).join(",");

  const sortedRecords = [...records].sort((a, b) => {
    const aTime = new Date(String(a.created_at)).getTime();
    const bTime = new Date(String(b.created_at)).getTime();
    return bTime - aTime;
  });

  const rows = sortedRecords.map((record) =>
    headers
      .map((column) => formatCsvValue(record[column]))
      .join(",")
  );

  const csvContent = `\uFEFF${[headerLine, ...rows].join("\r\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = generateTimestampedFilename(type);
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
