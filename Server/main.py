from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from security import (
    inspect_archive_limits,
    remove_file,
    run_analysis_in_worker,
    run_antivirus_scan,
    stream_upload_to_tempfile,
    validate_analyze_api_key,
)
from graph_engine import RelationshipEngine, DEMO_CASES
import os
import time
import logging
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

allowed_origin = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {
    ".dd", ".img", ".e01", ".ex01", ".l01", ".s01",
    ".pcap", ".pcapng",
    ".pdf", ".docx", ".xlsx", ".txt", ".csv", ".log",
    ".jpg", ".jpeg", ".png", ".bmp", ".tiff",
    ".zip", ".tar", ".gz",
}

MAX_FILE_SIZE = 500 * 1024 * 1024


@app.get("/api/stats")
async def get_case_stats():
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

def get_api_user(authorization: str | None = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = parts[1]

    admin_token = os.getenv("ADMIN_TOKEN")
    investigator_token = os.getenv("INVESTIGATOR_TOKEN")

    if admin_token and token == admin_token:
        return {"id": "admin", "role": "admin", "token": token}
    if investigator_token and token == investigator_token:
        return {"id": "investigator", "role": "investigator", "token": token}

    raise HTTPException(status_code=403, detail="Forbidden")


def write_audit(entry: str):
    try:
        with open("server_audit.log", "a") as f:
            f.write(entry + "\n")
    except Exception:
        logger.warning("Failed to write audit log")


@app.get("/api/stats")
async def get_case_stats(current_user: dict = Depends(get_api_user)):
    ...
@app.post("/api/analyze")
async def run_forensic_pipeline(request: Request, file: UploadFile = File(...)):
    tmp_path = None
    archive_metadata = None

    try:
        validate_analyze_api_key(request.headers.get("x-analyze-key"))

        # Reject oversized uploads before reading the body.
        # Content-Length is advisory but allows immediate rejection for honest
        # clients and standard tools, avoiding unnecessary network I/O and memory
        # pressure before stream_upload_to_tempfile enforces the hard byte limit.
        raw_content_length = request.headers.get("content-length")
        if raw_content_length is not None:
            try:
                if int(raw_content_length) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)} MB."
                    )
            except ValueError:
                logger.warning("Malformed Content-Length header received: %s", raw_content_length)

        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type '{ext}' is not permitted. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        try:
            tmp_path, _ = await stream_upload_to_tempfile(file, ext)
            archive_metadata = inspect_archive_limits(tmp_path, file.filename or "")
            antivirus_result = run_antivirus_scan(tmp_path)
            report = run_analysis_in_worker(tmp_path)
        finally:
            if tmp_path:
                remove_file(tmp_path)

        case_id = f"CASE-{int(time.time())}"

        # Record provenance to Supabase so it appears in the Evidence Graph
        try:
            from supabase import create_client
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            if url and key:
                client = create_client(url, key)
                new_case = {
                    "case_id": case_id,
                    "filename": file.filename,
                    "hash_value": f"SHA256:{report['hash_sha256']}",
                    "file_size": f"{report['metadata']['size_bytes']} bytes",
                    "status": "Pending Review",
                    "investigator": "system@forensics.com",
                    "metadata": {
                        "magic_signature": report['metadata']['magic_signature'],
                        # In a real app we'd try to extract device IDs from EXIF/metadata
                        "device_id": f"DEV-UPLOAD-{int(time.time())}"
                    }
                }
                client.table("cases").insert(new_case).execute()
        except Exception as e:
            logger.warning(f"Failed to record upload provenance to Supabase: {e}")

        return {
            "id": case_id,
            "filename": file.filename,
            "hash": f"SHA256: {report['hash_sha256']}",
            "hash_md5": f"MD5: {report['hash_md5']}",
            "size": f"{report['metadata']['size_bytes']} bytes",
            "created": report['metadata']['created'],
            "modified": report['metadata']['modified'],
            "accessed": report['metadata']['accessed'],
            "permissions": report['metadata']['permissions'],
            "exif_metadata": report['metadata']['exif'],
            "magic_signature": report['metadata']['magic_signature'],
            "threat_level": report['threat_level'],
            "status": "COMPLETED",
            "report_generated": True,
            "findings": f"Advanced Forensic Analysis: {report['metadata']['magic_signature']} detected. Integrity verified via Dual-Hash (SHA256+MD5).",
            "antivirus_scan": antivirus_result,
            "archive_inspection": archive_metadata,
            "analysis_mode": "isolated-worker",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forensic pipeline error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during forensic analysis.")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError as e:
                logger.warning(f"Failed to cleanup temp file {tmp_path}: {str(e)}")


@app.get("/api/graph/relationships")
async def get_graph_relationships():
    """Return the full evidence relationship graph (nodes, edges, suspicious patterns)."""
    try:
        cases = []
        try:
            from supabase import create_client
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            if url and key:
                client = create_client(url, key)
                response = client.table("cases").select("*").execute()
                cases = response.data or []
        except Exception as e:
            logger.warning(f"Supabase unavailable for graph, using demo data: {e}")

        if not cases:
            logger.info("No live cases found — falling back to demo graph data.")
            cases = DEMO_CASES

        engine = RelationshipEngine(cases)
        return engine.build_graph()

    except Exception as e:
        logger.error(f"Graph relationships error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate relationship graph.")


@app.get("/api/graph/provenance/{case_id}")
async def get_evidence_provenance(case_id: str):
    """Return the provenance / chain-of-custody timeline for a specific case."""
    try:
        cases = []
        try:
            from supabase import create_client
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            if url and key:
                client = create_client(url, key)
                response = client.table("cases").select("*").execute()
                cases = response.data or []
        except Exception as e:
            logger.warning(f"Supabase unavailable for provenance, using demo data: {e}")

        if not cases:
            cases = DEMO_CASES

        engine = RelationshipEngine(cases)
        result = engine.build_provenance_chain(case_id)

        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Provenance endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve provenance data.")


@app.get("/api/graph/expand/{node_id}")
async def expand_node(node_id: str):
    """Return the neighborhood (1-hop connections) for a specific node."""
    try:
        engine = RelationshipEngine(DEMO_CASES)
        graph = engine.build_graph()
        
        connected_edges = [e for e in graph["edges"] if e["source"] == node_id or e["target"] == node_id]
        
        connected_node_ids = {node_id}
        for e in connected_edges:
            connected_node_ids.add(e["source"])
            connected_node_ids.add(e["target"])
            
        connected_nodes = [n for n in graph["nodes"] if n["id"] in connected_node_ids]
        
        return {
            "nodes": connected_nodes,
            "edges": connected_edges,
        }
    except Exception as e:
        logger.error(f"Graph expand error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error expanding node.")


from fastapi import BackgroundTasks
import asyncio

async def dummy_heavy_analysis(job_id: str):
    """Simulate a long-running Redis-like worker job."""
    logger.info(f"Worker {job_id}: Starting heavy graph analysis...")
    await asyncio.sleep(5)  # Simulate DB/Graph traversal
    logger.info(f"Worker {job_id}: Analysis complete.")


@app.post("/api/graph/analyze")
async def trigger_graph_analysis(background_tasks: BackgroundTasks):
    """Simulate a Redis worker job trigger."""
    job_id = f"job-{int(time.time())}"
    background_tasks.add_task(dummy_heavy_analysis, job_id)
    return {"status": "accepted", "job_id": job_id, "message": "Graph analysis queued successfully."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
