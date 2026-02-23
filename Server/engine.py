import hashlib
import os
import datetime
import json

class ForensicEngine:
    def __init__(self, evidence_path):
        self.evidence_path = evidence_path
        self.report_data = {}

    def run_automated_process(self):
        # 1. Identification & Preservation (Hashing)
        print("Starting Identification...")
        sha256 = self.generate_hash()
        
        # 2. Collection (Metadata Extraction)
        print("Collecting Metadata...")
        metadata = self.get_metadata()
        
        # 3. Analysis & Reporting
        self.report_data = {
            "timestamp": str(datetime.datetime.now()),
            "evidence_name": os.path.basename(self.evidence_path),
            "hash_sha256": sha256,
            "metadata": metadata,
            "status": "Verified & Preserved"
        }
        return self.report_data

    def generate_hash(self):
        sha256_hash = hashlib.sha256()
        with open(self.evidence_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def get_metadata(self):
        stats = os.stat(self.evidence_path)
        return {
            "size_bytes": stats.st_size,
            "created": str(datetime.datetime.fromtimestamp(stats.st_ctime)),
            "modified": str(datetime.datetime.fromtimestamp(stats.st_mtime))
        }

# Example usage for the API
# engine = ForensicEngine("evidence.dd")
# print(engine.run_automated_process())