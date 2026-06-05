from __future__ import annotations

import gzip
import json
import os
import shlex
import shutil
import subprocess
import tarfile
import tempfile
import zipfile
from pathlib import Path

from fastapi import HTTPException, UploadFile


DEFAULT_ANALYZE_API_KEY = os.getenv("ANALYZE_API_KEY", "forensic-pro-suite-demo-analyze-key")
MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_BYTES", str(500 * 1024 * 1024)))
MAX_ARCHIVE_ENTRIES = int(os.getenv("MAX_ARCHIVE_ENTRIES", "10000"))
MAX_ARCHIVE_TOTAL_BYTES = int(os.getenv("MAX_ARCHIVE_TOTAL_BYTES", str(2 * 1024 * 1024 * 1024)))
MAX_ARCHIVE_COMPRESSION_RATIO = float(os.getenv("MAX_ARCHIVE_COMPRESSION_RATIO", "100.0"))
UPLOAD_CHUNK_SIZE = int(os.getenv("UPLOAD_CHUNK_SIZE", str(64 * 1024)))
ANALYSIS_TIMEOUT_SECONDS = int(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "120"))
AV_SCAN_TIMEOUT_SECONDS = int(os.getenv("AV_SCAN_TIMEOUT_SECONDS", "120"))


def _truthy(value: str | None) -> bool:
    return bool(value and value.strip().lower() in {"1", "true", "yes", "on"})


def _archive_entry_limit() -> int:
    return int(os.getenv("MAX_ARCHIVE_ENTRIES", str(MAX_ARCHIVE_ENTRIES)))


def _archive_total_limit() -> int:
    return int(os.getenv("MAX_ARCHIVE_TOTAL_BYTES", str(MAX_ARCHIVE_TOTAL_BYTES)))


def _archive_ratio_limit() -> float:
    return float(os.getenv("MAX_ARCHIVE_COMPRESSION_RATIO", str(MAX_ARCHIVE_COMPRESSION_RATIO)))


def validate_analyze_api_key(provided_key: str | None) -> None:
    if not DEFAULT_ANALYZE_API_KEY:
        return

    if not provided_key or provided_key != DEFAULT_ANALYZE_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized analyze request.")


async def stream_upload_to_tempfile(upload_file: UploadFile, suffix: str) -> tuple[str, int]:
    total_bytes = 0

    import tempfile
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as tmp:
            while True:
                chunk = await upload_file.read(UPLOAD_CHUNK_SIZE)
                if not chunk:
                    break

                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(status_code=413, detail="File exceeds the maximum allowed size.")

                tmp.write(chunk)
            tmp.flush()
        return tmp_path, total_bytes
    except Exception:
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
        raise



def _validate_zip_archive(path: str) -> dict[str, int | float | str]:
    with zipfile.ZipFile(path) as archive:
        infos = archive.infolist()
        entry_count = len(infos)
        if entry_count > _archive_entry_limit():
            raise HTTPException(status_code=400, detail="Archive contains too many entries.")

        total_uncompressed = sum(info.file_size for info in infos)
        total_compressed = sum(max(info.compress_size, 1) for info in infos)

        if total_uncompressed > _archive_total_limit():
            raise HTTPException(status_code=400, detail="Archive expands beyond the allowed size limit.")

        compression_ratio = total_uncompressed / total_compressed if total_compressed > 0 else 1.0
        if compression_ratio > _archive_ratio_limit():
            raise HTTPException(status_code=400, detail="Archive compression ratio is suspiciously high.")

        return {
            "archive_type": "zip",
            "entries": entry_count,
            "expanded_bytes": total_uncompressed,
            "compressed_bytes": total_compressed,
            "compression_ratio": round(compression_ratio, 2),
        }


def _validate_tar_archive(path: str) -> dict[str, int | float | str]:
    with tarfile.open(path, mode="r:*") as archive:
        members = archive.getmembers()
        entry_count = len(members)
        if entry_count > _archive_entry_limit():
            raise HTTPException(status_code=400, detail="Archive contains too many entries.")

        if any(member.issym() or member.islnk() for member in members):
            raise HTTPException(status_code=400, detail="Archive contains links that are not allowed.")

        total_uncompressed = sum(member.size for member in members if member.isfile())
        if total_uncompressed > _archive_total_limit():
            raise HTTPException(status_code=400, detail="Archive expands beyond the allowed size limit.")

        return {
            "archive_type": "tar",
            "entries": entry_count,
            "expanded_bytes": total_uncompressed,
            "compressed_bytes": os.path.getsize(path),
            "compression_ratio": round(total_uncompressed / max(os.path.getsize(path), 1), 2),
        }


def _validate_gzip_archive(path: str) -> dict[str, int | float | str]:
    expanded_bytes = 0
    with gzip.open(path, mode="rb") as archive:
        while True:
            chunk = archive.read(UPLOAD_CHUNK_SIZE)
            if not chunk:
                break

            expanded_bytes += len(chunk)
            if expanded_bytes > _archive_total_limit():
                raise HTTPException(status_code=400, detail="Compressed file expands beyond the allowed size limit.")

    compressed_bytes = os.path.getsize(path)
    return {
        "archive_type": "gzip",
        "entries": 1,
        "expanded_bytes": expanded_bytes,
        "compressed_bytes": compressed_bytes,
        "compression_ratio": round(expanded_bytes / max(compressed_bytes, 1), 2),
    }


def inspect_archive_limits(path: str, filename: str) -> dict[str, int | float | str] | None:
    lowered = filename.lower()

    if zipfile.is_zipfile(path) or lowered.endswith(".zip"):
        return _validate_zip_archive(path)

    if tarfile.is_tarfile(path) or lowered.endswith((".tar", ".tar.gz", ".tgz")):
        return _validate_tar_archive(path)

    if lowered.endswith(".gz"):
        return _validate_gzip_archive(path)

    return None


def run_antivirus_scan(path: str) -> dict[str, str]:
    if _truthy(os.getenv("DISABLE_ANTIVIRUS_SCAN")):
        return {"engine": "disabled", "status": "skipped"}

    command = os.getenv("AV_SCAN_COMMAND")
    if command:
        argv = shlex.split(command)
        if not argv:
            raise HTTPException(status_code=500, detail="AV_SCAN_COMMAND is configured but empty.")
        if "{path}" in command:
            argv = [part.format(path=path) for part in argv]
        else:
            argv.append(path)
    else:
        clamscan = shutil.which("clamscan") or shutil.which("clamdscan")
        if not clamscan:
            if _truthy(os.getenv("REQUIRE_ANTIVIRUS_SCAN")):
                raise HTTPException(status_code=503, detail="No antivirus scanner is available on this host.")
            return {"engine": "unavailable", "status": "skipped"}
        argv = [clamscan, "--no-summary", path]

    try:
        completed = subprocess.run(
            argv,
            capture_output=True,
            text=True,
            timeout=AV_SCAN_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Antivirus scan timed out.") from exc
    except OSError as exc:
        if _truthy(os.getenv("REQUIRE_ANTIVIRUS_SCAN")):
            raise HTTPException(
                status_code=503,
                detail=f"Antivirus scanner failed to execute: {str(exc)}"
            ) from exc
        return {"engine": "unavailable", "status": "skipped", "output": f"Antivirus scanner execution failed: {str(exc)}"}

    output = "\n".join(part for part in [completed.stdout.strip(), completed.stderr.strip()] if part)
    if completed.returncode == 0:
        return {"engine": Path(argv[0]).name, "status": "clean", "output": output}

    if completed.returncode == 1 or "FOUND" in output.upper():
        raise HTTPException(status_code=400, detail="File failed malware scan.")

    raise HTTPException(status_code=503, detail=f"Antivirus scan failed: {output or 'unknown error'}")



def run_analysis_in_worker(path: str) -> dict:
    worker_path = Path(__file__).with_name("worker_runner.py")
    try:
        completed = subprocess.run(
            [os.environ.get("PYTHON_EXECUTABLE", os.sys.executable), str(worker_path), path],
            capture_output=True,
            text=True,
            timeout=ANALYSIS_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=504, detail="Analysis timed out.") from exc

    if completed.returncode != 0:
        stderr = completed.stderr.strip() or completed.stdout.strip() or "Worker process failed."
        raise HTTPException(status_code=500, detail=stderr)

    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Worker returned invalid JSON.") from exc


def remove_file(path: str) -> None:
    Path(path).unlink(missing_ok=True)


import collections
import time

class RateLimiter:
    def __init__(self, requests_limit: int = 10, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        # maps client identifier (e.g. IP) to list of request timestamps
        self.requests = collections.defaultdict(list)

    def is_allowed(self, client_id: str) -> tuple[bool, int, int]:
        """
        Checks if client request is within rate limits.
        Returns:
            (is_allowed, remaining_requests, reset_seconds)
        """
        now = time.time()
        client_history = self.requests[client_id]
        
        # remove timestamps older than sliding window
        while client_history and client_history[0] < now - self.window_seconds:
            client_history.pop(0)
            
        remaining = self.requests_limit - len(client_history)
        
        if remaining > 0:
            client_history.append(now)
            remaining -= 1
            reset_time = int(self.window_seconds - (now - client_history[0])) if client_history else self.window_seconds
            return True, remaining, max(0, reset_time)
        else:
            reset_time = int(self.window_seconds - (now - client_history[0]))
            return False, 0, max(0, reset_time)

# Global rate limiter instance
LIMITER_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "30"))
LIMITER_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
global_rate_limiter = RateLimiter(LIMITER_REQUESTS, LIMITER_WINDOW)

