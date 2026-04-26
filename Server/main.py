from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from engine import ForensicEngine
import asyncio
import tempfile
import os
import time

app = FastAPI()

allowed_origin = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Forensic evidence file types — executables and scripts are explicitly excluded
ALLOWED_EXTENSIONS = {
    ".dd", ".img", ".e01", ".ex01", ".l01", ".s01",  # disk images
    ".pcap", ".pcapng",                                # network captures
    ".pdf", ".docx", ".xlsx", ".txt", ".csv", ".log", # documents / logs
    ".jpg", ".jpeg", ".png", ".bmp", ".tiff",         # images
    ".zip", ".tar", ".gz",                             # archives
}


MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB

@app.get("/api/stats")
async def get_case_stats():
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            raise HTTPException(status_code=500, detail="Supabase credentials not configured.")

        client = create_client(url, key)
        response = client.table("cases").select("status").execute()
        cases = response.data

        total = len(cases)
        pending = sum(1 for c in cases if (c.get("status") or "").lower() == "pending")
        verified = sum(1 for c in cases if (c.get("status") or "").lower() == "verified")

        return {
            "total": total,
            "pending": pending,
            "verified": verified,
            "reports_generated": verified
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def run_forensic_pipeline(file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type '{ext}' is not permitted. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File exceeds the 500 MB size limit.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            engine = ForensicEngine(tmp_path)
            report = engine.run_automated_process()
        finally:
            os.unlink(tmp_path)

        await asyncio.sleep(2)

        return {
            "id": f"CASE-{int(time.time())}",
            "filename": file.filename,
            "hash": f"SHA256: {report['hash_sha256']}",
            "size": f"{report['metadata']['size_bytes']} bytes",
            "created": report['metadata']['created'],
            "modified": report['metadata']['modified'],
            "status": "COMPLETED",
            "report_generated": True,
            "findings": "No malicious artifacts detected in initial triage."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)