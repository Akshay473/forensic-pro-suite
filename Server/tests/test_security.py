from __future__ import annotations

import asyncio
import gzip
import os
import tempfile
import unittest
import zipfile
from pathlib import Path

from fastapi import HTTPException

from security import inspect_archive_limits, stream_upload_to_tempfile


class FakeUploadFile:
    def __init__(self, payload: bytes):
        self._payload = payload
        self._offset = 0

    async def read(self, size: int = -1) -> bytes:
        if self._offset >= len(self._payload):
            return b""

        if size < 0:
            size = len(self._payload) - self._offset

        chunk = self._payload[self._offset : self._offset + size]
        self._offset += len(chunk)
        return chunk


class SecurityHelpersTests(unittest.TestCase):
    def test_stream_upload_to_tempfile_writes_payload(self) -> None:
        async def run_test() -> None:
            fake = FakeUploadFile(b"hello world")
            tmp_path, size = await stream_upload_to_tempfile(fake, ".txt")
            try:
                self.assertEqual(size, 11)
                self.assertEqual(Path(tmp_path).read_bytes(), b"hello world")
            finally:
                Path(tmp_path).unlink(missing_ok=True)

        asyncio.run(run_test())

    def test_zip_archive_over_limit_is_rejected(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                for index in range(12):
                    archive.writestr(f"entry-{index}.txt", "A" * 8)

            previous_limit = os.environ.get("MAX_ARCHIVE_ENTRIES")
            os.environ["MAX_ARCHIVE_ENTRIES"] = "10"
            with self.assertRaises(HTTPException):
                inspect_archive_limits(tmp_path, "sample.zip")
            if previous_limit is None:
                os.environ.pop("MAX_ARCHIVE_ENTRIES", None)
            else:
                os.environ["MAX_ARCHIVE_ENTRIES"] = previous_limit
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_gzip_archive_inspection_reports_expanded_size(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".gz", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with gzip.open(tmp_path, "wb") as archive:
                archive.write(b"x" * 1024)

            result = inspect_archive_limits(tmp_path, "sample.gz")
            self.assertIsNotNone(result)
            self.assertEqual(result["archive_type"], "gzip")
            self.assertEqual(result["entries"], 1)
            self.assertGreaterEqual(result["expanded_bytes"], 1024)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_verify_file_signature_pcap_little_endian(self) -> None:
        from engine import ForensicEngine
        with tempfile.NamedTemporaryFile(suffix=".pcap", delete=False) as tmp:
            tmp.write(b"\xd4\xc3\xb2\xa1somepcapdata")
            tmp_path = tmp.name
        try:
            engine = ForensicEngine(tmp_path)
            verified, sig_name = engine.verify_file_signature()
            self.assertTrue(verified)
            self.assertEqual(sig_name, "PCAP Network Capture (Little Endian)")
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_verify_file_signature_pcap_big_endian(self) -> None:
        from engine import ForensicEngine
        with tempfile.NamedTemporaryFile(suffix=".pcap", delete=False) as tmp:
            tmp.write(b"\xa1\xb2\xc3\xd4somepcapdata")
            tmp_path = tmp.name
        try:
            engine = ForensicEngine(tmp_path)
            verified, sig_name = engine.verify_file_signature()
            self.assertTrue(verified)
            self.assertEqual(sig_name, "PCAP Network Capture (Big Endian)")
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_verify_file_signature_pcapng(self) -> None:
        from engine import ForensicEngine
        with tempfile.NamedTemporaryFile(suffix=".pcapng", delete=False) as tmp:
            tmp.write(b"\x0a\x0d\x0d\x0asomepcapngdata")
            tmp_path = tmp.name
        try:
            engine = ForensicEngine(tmp_path)
            verified, sig_name = engine.verify_file_signature()
            self.assertTrue(verified)
            self.assertEqual(sig_name, "PCAPNG Network Capture")
        finally:
            Path(tmp_path).unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
