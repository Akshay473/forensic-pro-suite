import { ForensicReportData } from "./reportGenerator";

export interface CaseSummary {
  overview: string;
  keyFindings: string[];
  riskAssessment: string;
  suggestedNextSteps: string[];
}

async function callGroqAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Call Groq API safely
 */
async function callGroqAPI(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a forensic analysis expert. Always respond in strict JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }, // forces JSON output
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

/**
 * 🔥 Prevent React crash: ensure ALL values become strings
 */
function normalizeArray(input: any): string[] {
  if (!Array.isArray(input)) return [];

  return input.map((item) => {
    if (typeof item === "string") return item;

    if (typeof item === "object" && item !== null) {
      return (
        item.finding ||
        item.Finding ||
        item.description ||
        item.Description ||
        item.text ||
        JSON.stringify(item)
      );
    }

    return String(item);
  });
}

/**
 * Parse JSON safely even if model returns extra text
 */
function safeJSONParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from model");
    return JSON.parse(match[0]);
  }
}

/**
 * MAIN SUMMARY (DETAILED)
 */
export async function generateCaseSummary(
  data: ForensicReportData
): Promise<CaseSummary> {
  const prompt = `
You are a forensic analysis expert. Analyze the following case evidence and provide a structured JSON response.

Case ID: ${data.case_id}
Filename: ${data.filename}
Hash (SHA-256): ${data.hash_value}
File Size: ${data.file_size || "Unknown"}
Status: ${data.status}
Creation Date: ${data.creation_date || "Unknown"}
Modification Date: ${data.modification_date || "Unknown"}
Investigator: ${data.investigator}
${data.notes ? `Notes: ${data.notes}` : ""}

Return ONLY valid JSON in this format:
{
  "overview": string,
  "keyFindings": string[],
  "riskAssessment": string,
  "suggestedNextSteps": string[]
}
`;

  try {
    const responseText = await callGroqAPI(prompt);
    const parsed = safeJSONParse(responseText);

    return {
      overview: parsed.overview || "",
      keyFindings: normalizeArray(parsed.keyFindings),
      riskAssessment: parsed.riskAssessment || "",
      suggestedNextSteps: normalizeArray(parsed.suggestedNextSteps),
    };
  } catch (error) {
    console.error("Error generating case summary:", error);

    return {
      overview: "Unable to generate AI summary at this time.",
      keyFindings: [],
      riskAssessment: "Analysis unavailable",
      suggestedNextSteps: [],
    };
  }
}

/**
 * QUICK SUMMARY (1–2 lines)
 */
export async function generateQuickSummary(
  data: ForensicReportData
): Promise<string> {
  const prompt = `
You are a forensic expert. Summarize this case in 1–2 sentences only.

Case: ${data.case_id}
File: ${data.filename}
Hash: ${data.hash_value}
Status: ${data.status}
${data.notes ? `Notes: ${data.notes}` : ""}

Return plain text only.
`;

  try {
    return await callGroqAPI(prompt);
  } catch (error) {
    console.error("Error generating quick summary:", error);
    return "Summary generation unavailable.";
  }
}