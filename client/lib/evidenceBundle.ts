import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateForensicReport } from "./reportGenerator";

type EvidenceData = {
  case_id: string;
  filename: string;
  hash_value: string;
  investigator: string;
  status: string;
  created_at: string;
};

export async function exportEvidenceBundle(
  data: EvidenceData,
  originalFile?: File
) {
  const zip = new JSZip();

  // metadata.json
  const metadata = {
    case_id: data.case_id,
    filename: data.filename,
    investigator: data.investigator,
    status: data.status,
    created_at: data.created_at,
  };

  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  // sha256.txt
  zip.file("sha256.txt", data.hash_value);

  // PDF report
  const pdfBlob = (await generateForensicReport(data, true)) as Blob;

  zip.file("report.pdf", pdfBlob);

  // original uploaded file
  if (originalFile) {
    zip.file(originalFile.name, originalFile);
  }

  // generate ZIP
  const content = await zip.generateAsync({ type: "blob" });

  saveAs(content, `evidence_bundle_${data.case_id}.zip`);
}