import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ANALYZE_PROXY_KEY = process.env.ANALYZE_API_KEY ?? "forensic-pro-suite-demo-analyze-key";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
    }

    const forwardForm = new FormData();
    forwardForm.append("file", file, file.name);

    const backendResponse = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "X-Analyze-Key": ANALYZE_PROXY_KEY,
      },
      body: forwardForm,
    });

    const contentType = backendResponse.headers.get("content-type") || "application/json";
    const payload = await backendResponse.text();

    return new NextResponse(payload, {
      status: backendResponse.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    console.error("Analyze proxy request failed:", error);
    return NextResponse.json(
      { error: "Unable to reach the forensic backend service." },

export const runtime = "nodejs";

// Immutable infrastructure configurations 
const ANALYZE_PROXY_KEY = process.env.ANALYZE_API_KEY ?? "forensic-pro-suite-demo-analyze-key";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
    }

    const forwardForm = new FormData();
    forwardForm.append("file", file, file.name);

    // 1. Session Guard Check - Deny unauthenticated external requests immediately
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

    // 4. Dispatch proxy request downstream over secure network lanes
    const backendResponse = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "X-Analyze-Key": ANALYZE_PROXY_KEY,
      },
      body: forwardForm,
    });

    const contentType = backendResponse.headers.get("content-type") || "application/json";
    const payload = await backendResponse.text();

    return new NextResponse(payload, {
      status: backendResponse.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    console.error("Analyze proxy request failed:", error);
    return NextResponse.json(
      { error: "Unable to reach the forensic backend service." },
    // 5. Extract and parse data safely without dropping file stream contexts
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

    // 6. Return response to consumer while matching upstream binary content-types
    return new NextResponse(rawPayload, {
      status: backendResponse.status,
      headers: { "Content-Type": contentType },
    });

  } catch (error) {
    // Catch-all safety net for socket hangups, infrastructure drops, or missing environment hooks
    console.error("Critical routing failure encountered inside Analysis Proxy API:", error);
    return NextResponse.json(
      { error: "Gateway Exception: Unable to establish connection lanes with the processing cluster." },
      { status: 502 }
    );
  }
}
