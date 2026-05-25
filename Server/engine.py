import hashlib
import os
import datetime

class ForensicEngine:
    def __init__(self, evidence_path, precomputed_hashes=None):
        self.evidence_path = evidence_path
        self.report_data = {}
        self.precomputed_hashes = precomputed_hashes or {}

    def run_automated_process(self):
        print("Starting Identification...")
        sha256 = self.precomputed_hashes.get("sha256") or self.generate_hash("sha256")
        md5 = self.precomputed_hashes.get("md5") or self.generate_hash("md5")

        print("Verifying Magic Numbers...")
        magic_verified, file_sig = self.verify_file_signature()

        print("Collecting Advanced Metadata...")
        metadata = self.get_metadata()
        metadata["magic_signature"] = file_sig
        metadata["signature_match"] = magic_verified

        print("Extracting Image EXIF Data (if applicable)...")
        metadata["exif"] = self.extract_image_exif(file_sig)

        self.report_data = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "evidence_name": os.path.basename(self.evidence_path),
            "hash_sha256": sha256,
            "hash_md5": md5,
            "metadata": metadata,
            "status": "Verified & Preserved",
            "threat_level": "Low" if magic_verified else "Elevated (Signature Mismatch)"
        }
        return self.report_data

    def generate_hash(self, algo="sha256"):
        h = hashlib.sha256() if algo == "sha256" else hashlib.md5()
        with open(self.evidence_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                h.update(byte_block)
        return h.hexdigest()

    def verify_file_signature(self):
        signatures = {
            b"\x89PNG\r\n\x1a\n": "PNG Image",
            b"\xff\xd8\xff": "JPEG Image",
            b"%PDF": "PDF Document",
            b"PK\x03\x04": "ZIP/Office Archive",
            b"MZ": "Executable (Warning)",
            b"\xd4\xc3\xb2\xa1": "PCAP Network Capture (Little Endian)",
            b"\xa1\xb2\xc3\xd4": "PCAP Network Capture (Big Endian)",
            b"\x0a\x0d\x0d\x0a": "PCAPNG Network Capture",
        }
        try:
            with open(self.evidence_path, "rb") as f:
                header = f.read(16)
                for sig, name in signatures.items():
                    if header.startswith(sig):
                        return True, name
                return False, "Unknown/Generic Data"
        except Exception:
            return False, "Error Reading Header"

    def get_metadata(self):
        stats = os.stat(self.evidence_path)
        return {
            "size_bytes": stats.st_size,
            "created": datetime.datetime.fromtimestamp(stats.st_ctime, tz=datetime.timezone.utc).isoformat(),
            "modified": datetime.datetime.fromtimestamp(stats.st_mtime, tz=datetime.timezone.utc).isoformat(),
            "accessed": datetime.datetime.fromtimestamp(stats.st_atime, tz=datetime.timezone.utc).isoformat(),
            "permissions": oct(stats.st_mode)[-3:]
        }

    def extract_image_exif(self, file_sig: str) -> dict:
        supported_formats = ["PNG Image", "JPEG Image"]

        if file_sig not in supported_formats:
            return {"status": "skipped", "message": "File signature is not a supported image format"}

        from utils import extract_exif_data
        try:
            with open(self.evidence_path, "rb") as file_handler:
                image_binary_payload = file_handler.read()

            return extract_exif_data(image_binary_payload)

        except Exception as e:
            return {"status": "error", "message": f"Engine failed to read file bytes: {str(e)}"}