import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ANALYZE_PROXY_KEY = process.env.ANALYZE_API_KEY ?? "forensic-pro-suite-demo-analyze-key";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Resilient fetch wrapper with retry and timeout logic
async function fetchWithRetryAndTimeout(
  url: string,
  options: RequestInit,
  retries: number = 3,
  delay: number = 1000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 90000); // 90 second timeout for large uploads

  const optionsWithTimeout = { ...options, signal: controller.signal };

  try {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, optionsWithTimeout);
        clearTimeout(id);
        return response;
      } catch (err: any) {
        if (i === retries - 1 || err.name === "AbortError") {
          throw err;
        }
        // Exponential backoff delay
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error("Request failed after max retries");
  } finally {
    clearTimeout(id);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Session Guard Check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access: Valid investigator token required." },
        { status: 401 }
      );
    }

    // 2. Parse Multipart Content Form Data payload safely
    const incomingFormData = await request.formData();
    const uploadedFile = incomingFormData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "Validation failure: Missing or malformed 'file' field parameters." },
        { status: 400 }
      );
    }

    // 3. Rebuild an isolated, clean outbound FormData package
    const forwardForm = new FormData();
    forwardForm.append("file", uploadedFile, uploadedFile.name);

    // 4. Dispatch proxy request downstream over secure network lanes with retries/timeouts
    const backendResponse = await fetchWithRetryAndTimeout(
      `${BACKEND_URL}/api/analyze`,
      {
        method: "POST",
        headers: {
          "X-Analyze-Key": ANALYZE_PROXY_KEY,
        },
        body: forwardForm,
      },
      3,
      1000
    );

    const contentType = backendResponse.headers.get("content-type") || "application/json";
    const rawPayload = await backendResponse.text();

    if (!backendResponse.ok) {
      console.error(
        `Forensic downstream service failed. Status: ${backendResponse.status}. Body: ${rawPayload.slice(0, 500)}`
      );
      return NextResponse.json(
        { error: "Forensic analytics engine encountered an error while processing the artifact." },
        { status: backendResponse.status }
      );
    }

    // 5. Return response to consumer while matching upstream binary content-types
    return new NextResponse(rawPayload, {
      status: backendResponse.status,
      headers: { "Content-Type": contentType },
    });

  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("Forensic analysis request timed out.");
      return NextResponse.json(
        { error: "Timeout Exception: The downstream analysis engine took too long to respond." },
        { status: 504 }
      );
    }
  } catch (error) {
    // Catch-all safety net for socket hangups or missing environment hooks
    console.error("Critical routing failure encountered inside Analysis Proxy API:", error);
    return NextResponse.json(
      { error: "Gateway Exception: Unable to establish connection lanes with the processing cluster." },
      { status: 502 }
    );
  }
}
