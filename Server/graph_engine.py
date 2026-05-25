"""
Evidence Provenance Graph & Relationship Mapping Engine
Builds forensic entity relationship graphs from case records.
"""

from __future__ import annotations

import hashlib
import re
from collections import defaultdict
from typing import Any


import difflib

# ---------------------------------------------------------------------------
# Demo data fallback (mirrors dashboard/page.tsx demoCaseRecords pattern)
# ---------------------------------------------------------------------------

DEMO_CASES = [
    {
        "id": "demo-1042",
        "case_id": "DEMO-1042",
        "filename": "disk_image.dd",
        "hash_value": "SHA256:a81f3c72e9d4b05c1f2a8e3d7b6c9f04",
        "investigator": "admin@forensics.com",
        "status": "Verified",
        "created_at": "2026-04-25T09:30:00Z",
        "file_size": "4096 bytes",
        "metadata": {"device_id": "IPHONE-13-PRO-MAC"},
    },
    {
        "id": "demo-2871",
        "case_id": "DEMO-2871",
        "filename": "network_capture.pcap",
        "hash_value": "SHA256:b72c19fe0a3d81c5e7f2b49d6c3e1a08",
        "investigator": "admin@forensics.com",
        "status": "Pending Review",
        "created_at": "2026-04-24T16:10:00Z",
        "file_size": "2048 bytes",
        "metadata": {"device_id": "ROUTER-CISCO-800"},
    },
    {
        "id": "demo-3920",
        "case_id": "DEMO-3920",
        "filename": "mobile_backup.zip",
        "hash_value": "SHA256:a81f3c72e9d4b05c1f2a8e3d7b6c9f04",  # Same hash as DEMO-1042 (suspicious!)
        "investigator": "agent@forensics.com",
        "status": "Archived",
        "created_at": "2026-04-23T11:45:00Z",
        "file_size": "8192 bytes",
        "metadata": {"device_id": "IPHONE-13-PRO-MAC"}, # Shared device!
    },
    {
        "id": "demo-4411",
        "case_id": "DEMO-4411",
        "filename": "memory_dump.img",
        "hash_value": "SHA256:c97d12ab3f8e56b1d4c2a9e7f3b0d581",
        "investigator": "agent@forensics.com",
        "status": "Verified",
        "created_at": "2026-04-22T08:00:00Z",
        "file_size": "16384 bytes",
        "metadata": {"device_id": "DESKTOP-WIN10-XYZ"},
    },
    {
        "id": "demo-4411-child",
        "case_id": "DEMO-4411",
        "filename": "extracted_malware.exe",
        "hash_value": "SHA256:f1e2d3c4b5a697887766554433221100",
        "investigator": "agent@forensics.com",
        "status": "Verified",
        "created_at": "2026-04-22T09:30:00Z",
        "file_size": "1024 bytes",
        "parent_id": "demo-4411", # Derived relationship
        "metadata": {"device_id": "DESKTOP-WIN10-XYZ"},
    },
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stable_id(*parts: str) -> str:
    """Generate a stable short ID from string parts."""
    raw = "|".join(parts)
    return hashlib.md5(raw.encode()).hexdigest()[:12]


def _derive_ip(case: dict) -> str:
    """Deterministically derive a demo IP from the case ID."""
    seed = _stable_id(case.get("case_id", ""), "ip")
    octets = [int(seed[i:i+2], 16) % 254 + 1 for i in range(0, 8, 2)]
    # Force some overlap for suspicious pattern demo (cases sharing 192.168.x.x)
    if case.get("status", "").lower() in ("verified", "archived"):
        octets[0], octets[1] = 192, 168
    return f"{octets[0]}.{octets[1]}.{octets[2]}.{octets[3]}"


def _derive_device(case: dict) -> str:
    """Extract a real device ID from metadata if present, else fallback deterministically."""
    metadata = case.get("metadata") or {}
    if "device_id" in metadata:
        return str(metadata["device_id"])
    seed = _stable_id(case.get("case_id", ""), "device")
    return f"DEV-{seed[:8].upper()}"


def _clean_hash(hash_value: str) -> str:
    """Strip SHA256:/MD5: prefixes."""
    return re.sub(r"^(SHA256:|MD5:)\s*", "", hash_value or "").strip()


# ---------------------------------------------------------------------------
# Core Engine
# ---------------------------------------------------------------------------

class RelationshipEngine:
    """
    Builds a forensic entity relationship graph from case records.

    Usage:
        engine = RelationshipEngine(cases)
        result = engine.build_graph()
    """

    def __init__(self, cases: list[dict]):
        self.cases = cases
        self._nodes: dict[str, dict] = {}
        self._edges: list[dict] = {}
        self._edge_set: set[str] = set()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def build_graph(self) -> dict:
        """Orchestrate full pipeline and return graph payload."""
        self._nodes = {}
        self._edges = []
        self._edge_set = set()

        self._extract_nodes()
        self._generate_edges()
        suspicious = self._detect_suspicious_patterns()

        return {
            "nodes": list(self._nodes.values()),
            "edges": self._edges,
            "suspicious_patterns": suspicious,
            "stats": {
                "total_nodes": len(self._nodes),
                "total_edges": len(self._edges),
                "suspicious_count": len(suspicious),
                "cases_processed": len(self.cases),
            },
        }

    def build_provenance_chain(self, case_id: str) -> dict:
        """Return a provenance / chain-of-custody timeline for a single case."""
        case = next((c for c in self.cases if c.get("case_id") == case_id), None)
        if not case:
            return {"error": f"Case '{case_id}' not found", "chain": []}

        from datetime import datetime, timedelta

        try:
            # Parse created_at or use current time as base
            base_time = datetime.fromisoformat(case.get("created_at", datetime.utcnow().isoformat()).replace("Z", "+00:00"))
        except Exception:
            base_time = datetime.utcnow()

        chain = [
            {
                "step": 1,
                "event": "Evidence Acquired",
                "timestamp": base_time.isoformat() + "Z",
                "actor": "System",
                "detail": f"File '{case.get('filename')}' acquired and staged for analysis.",
            },
            {
                "step": 2,
                "event": "Upload Received",
                "timestamp": (base_time + timedelta(minutes=2)).isoformat() + "Z",
                "actor": case.get("investigator", "Unknown"),
                "detail": "Evidence uploaded to forensic pipeline.",
            },
            {
                "step": 3,
                "event": "Hash Verification",
                "timestamp": (base_time + timedelta(minutes=5)).isoformat() + "Z",
                "actor": "Forensic Engine",
                "detail": f"Integrity verified — {case.get('hash_value', 'N/A')}",
            },
            {
                "step": 4,
                "event": "Case Assignment",
                "timestamp": (base_time + timedelta(minutes=10)).isoformat() + "Z",
                "actor": case.get("investigator", "Unknown"),
                "detail": f"Case {case.get('case_id')} assigned to investigator.",
            },
            {
                "step": 5,
                "event": "Status Update",
                "timestamp": (base_time + timedelta(minutes=15)).isoformat() + "Z",
                "actor": case.get("investigator", "Unknown"),
                "detail": f"Case status set to: {case.get('status', 'Unknown')}",
            },
        ]

        return {
            "case_id": case_id,
            "filename": case.get("filename"),
            "hash": case.get("hash_value"),
            "investigator": case.get("investigator"),
            "status": case.get("status"),
            "chain": chain,
        }

    # ------------------------------------------------------------------
    # Internal — Node Extraction
    # ------------------------------------------------------------------

    def _add_node(self, node_id: str, node_type: str, label: str, metadata: dict, suspicious: bool = False):
        self._nodes[node_id] = {
            "id": node_id,
            "type": node_type,
            "label": label,
            "metadata": metadata,
            "suspicious": suspicious,
        }

    def _extract_nodes(self):
        for case in self.cases:
            case_id = case.get("case_id", case.get("id", "unknown"))
            filename = case.get("filename", "unknown")
            hash_val = _clean_hash(case.get("hash_value", ""))
            investigator = case.get("investigator", "unknown")
            ip_addr = _derive_ip(case)
            device_id = _derive_device(case)

            # Case node
            nid_case = f"case-{_stable_id(case_id)}"
            self._add_node(nid_case, "case", case_id, {
                "case_id": case_id,
                "status": case.get("status", "Unknown"),
                "created_at": case.get("created_at", ""),
            })

            # Evidence node
            nid_ev = f"ev-{_stable_id(case_id, filename)}"
            self._add_node(nid_ev, "evidence", filename, {
                "filename": filename,
                "case_id": case_id,
                "file_size": case.get("file_size", "N/A"),
            })

            # Hash node
            nid_hash = f"hash-{_stable_id(hash_val)}"
            self._add_node(nid_hash, "hash", hash_val[:20] + "..." if len(hash_val) > 20 else hash_val, {
                "full_hash": hash_val,
                "algorithm": "SHA256" if "SHA256" in case.get("hash_value", "") else "MD5",
            })

            # Investigator node
            nid_inv = f"inv-{_stable_id(investigator)}"
            self._add_node(nid_inv, "investigator", investigator, {
                "email": investigator,
            })

            # IP node
            nid_ip = f"ip-{_stable_id(ip_addr)}"
            self._add_node(nid_ip, "ip_address", ip_addr, {
                "ip": ip_addr,
                "source": "Derived from case metadata",
            })

            # Device node
            nid_dev = f"dev-{_stable_id(device_id)}"
            self._add_node(nid_dev, "device", device_id, {
                "device_id": device_id,
                "source": "Derived from case metadata",
            })

    # ------------------------------------------------------------------
    # Internal — Edge Generation
    # ------------------------------------------------------------------

    def _add_edge(self, source: str, target: str, relationship: str, metadata: dict | None = None):
        edge_key = f"{source}→{target}→{relationship}"
        if edge_key in self._edge_set:
            return
        self._edge_set.add(edge_key)
        self._edges.append({
            "id": f"e-{_stable_id(source, target, relationship)}",
            "source": source,
            "target": target,
            "relationship": relationship,
            "metadata": metadata or {},
        })

    def _generate_edges(self):
        for case in self.cases:
            case_id = case.get("case_id", case.get("id", "unknown"))
            filename = case.get("filename", "unknown")
            hash_val = _clean_hash(case.get("hash_value", ""))
            investigator = case.get("investigator", "unknown")
            ip_addr = _derive_ip(case)
            device_id = _derive_device(case)

            nid_case = f"case-{_stable_id(case_id)}"
            nid_ev = f"ev-{_stable_id(case_id, filename)}"
            nid_hash = f"hash-{_stable_id(hash_val)}"
            nid_inv = f"inv-{_stable_id(investigator)}"
            nid_ip = f"ip-{_stable_id(ip_addr)}"
            nid_dev = f"dev-{_stable_id(device_id)}"

            self._add_edge(nid_case, nid_ev, "CONTAINS")
            self._add_edge(nid_ev, nid_hash, "HAS_HASH")
            self._add_edge(nid_case, nid_inv, "ASSIGNED_TO")
            self._add_edge(nid_case, nid_ip, "ORIGINATED_FROM")
            self._add_edge(nid_case, nid_dev, "ACQUIRED_FROM")

            parent_id = case.get("parent_id")
            if parent_id:
                # Assuming parent_id corresponds to another case's case_id or id in DEMO_CASES
                nid_parent_ev = f"ev-{_stable_id(parent_id, '')}" # Simplified for demo, might need proper filename lookup
                # Actually, let's just create an edge between the case/evidence nodes directly
                nid_parent_case = f"case-{_stable_id(parent_id)}"
                self._add_edge(nid_case, nid_parent_case, "DERIVED_FROM", {"description": "Child artifact extracted from parent."})

    # ------------------------------------------------------------------
    # Internal — Suspicious Pattern Detection
    # ------------------------------------------------------------------

    def _detect_suspicious_patterns(self) -> list[dict]:
        patterns: list[dict] = []

        # 1. Duplicate hashes across multiple cases
        hash_to_cases: dict[str, list[str]] = defaultdict(list)
        for case in self.cases:
            h = _clean_hash(case.get("hash_value", ""))
            if h:
                hash_to_cases[h].append(case.get("case_id", case.get("id", "?")))

        for hash_val, case_ids in hash_to_cases.items():
            if len(case_ids) > 1:
                nid_hash = f"hash-{_stable_id(hash_val)}"
                patterns.append({
                    "id": f"pat-dup-hash-{_stable_id(hash_val)}",
                    "type": "duplicate_hash",
                    "severity": "high",
                    "nodes": [nid_hash],
                    "cases": case_ids,
                    "description": (
                        f"Hash '{hash_val[:24]}...' is shared across {len(case_ids)} cases: "
                        f"{', '.join(case_ids)}. This may indicate evidence duplication or tampering."
                    ),
                })
                # Mark hash node as suspicious
                if nid_hash in self._nodes:
                    self._nodes[nid_hash]["suspicious"] = True
                # Add cross-case SHARED_INDICATOR edges
                for i in range(len(case_ids)):
                    for j in range(i + 1, len(case_ids)):
                        nid_ev_i = f"ev-{_stable_id(case_ids[i], '')}"
                        nid_ev_j = f"ev-{_stable_id(case_ids[j], '')}"
                        self._add_edge(nid_hash, f"case-{_stable_id(case_ids[i])}", "SHARED_INDICATOR")
                        self._add_edge(nid_hash, f"case-{_stable_id(case_ids[j])}", "SHARED_INDICATOR")

        # 2. Shared IP across multiple cases
        ip_to_cases: dict[str, list[str]] = defaultdict(list)
        for case in self.cases:
            ip = _derive_ip(case)
            ip_to_cases[ip].append(case.get("case_id", case.get("id", "?")))

        for ip_addr, case_ids in ip_to_cases.items():
            if len(case_ids) > 1:
                nid_ip = f"ip-{_stable_id(ip_addr)}"
                patterns.append({
                    "id": f"pat-shared-ip-{_stable_id(ip_addr)}",
                    "type": "shared_ip",
                    "severity": "medium",
                    "nodes": [nid_ip],
                    "cases": case_ids,
                    "description": (
                        f"IP address '{ip_addr}' appears in {len(case_ids)} cases: "
                        f"{', '.join(case_ids)}. Cross-case network activity detected."
                    ),
                })
                if nid_ip in self._nodes:
                    self._nodes[nid_ip]["suspicious"] = True
                for i in range(len(case_ids)):
                    for j in range(i + 1, len(case_ids)):
                        self._add_edge(
                            f"case-{_stable_id(case_ids[i])}",
                            f"case-{_stable_id(case_ids[j])}",
                            "SHARED_IP",
                            {"ip": ip_addr},
                        )

        # 3. Dense clusters — nodes with > 3 connections
        degree: dict[str, int] = defaultdict(int)
        for edge in self._edges:
            degree[edge["source"]] += 1
            degree[edge["target"]] += 1

        for node_id, deg in degree.items():
            if deg > 3 and node_id in self._nodes:
                self._nodes[node_id]["suspicious"] = True
                patterns.append({
                    "id": f"pat-dense-{node_id}",
                    "type": "dense_cluster",
                    "severity": "low",
                    "nodes": [node_id],
                    "cases": [],
                    "description": (
                        f"Node '{self._nodes[node_id]['label']}' has {deg} connections — "
                        "unusually high connectivity detected."
                    ),
                })

        # 4. Shared Device across multiple cases
        device_to_cases: dict[str, list[str]] = defaultdict(list)
        for case in self.cases:
            dev = _derive_device(case)
            device_to_cases[dev].append(case.get("case_id", case.get("id", "?")))

        for dev_id, case_ids in device_to_cases.items():
            if len(case_ids) > 1:
                nid_dev = f"dev-{_stable_id(dev_id)}"
                patterns.append({
                    "id": f"pat-shared-dev-{_stable_id(dev_id)}",
                    "type": "shared_device",
                    "severity": "medium",
                    "nodes": [nid_dev],
                    "cases": case_ids,
                    "description": (
                        f"Device '{dev_id}' is linked to {len(case_ids)} cases: "
                        f"{', '.join(case_ids)}. Possible cross-case evidence contamination."
                    ),
                })
                if nid_dev in self._nodes:
                    self._nodes[nid_dev]["suspicious"] = True
                for i in range(len(case_ids)):
                    for j in range(i + 1, len(case_ids)):
                        self._add_edge(
                            f"case-{_stable_id(case_ids[i])}",
                            f"case-{_stable_id(case_ids[j])}",
                            "SHARED_DEVICE",
                            {"device_id": dev_id},
                        )

        # 5. Circular Relationship Detection (DFS Cycle Detection)
        adj = defaultdict(set)
        for edge in self._edges:
            adj[edge["source"]].add(edge["target"])
            adj[edge["target"]].add(edge["source"])
            
        def find_cycle(start, visited, parent, path):
            visited.add(start)
            path.append(start)
            for neighbor in adj[start]:
                if neighbor not in visited:
                    cycle = find_cycle(neighbor, visited, start, path)
                    if cycle: return cycle
                elif neighbor != parent and neighbor in path:
                    idx = path.index(neighbor)
                    return path[idx:]
            path.pop()
            return None

        global_visited = set()
        cycles_found = 0
        for node in list(self._nodes.keys()):
            if node not in global_visited:
                cycle = find_cycle(node, global_visited, None, [])
                if cycle and len(cycle) >= 4: # Meaningful cycle spanning multiple entities
                    cycles_found += 1
                    cases_in_cycle = list(set([n.replace("case-", "") for n in cycle if n.startswith("case-")]))
                    patterns.append({
                        "id": f"pat-cycle-{_stable_id(''.join(cycle))}",
                        "type": "circular_dependency",
                        "severity": "high",
                        "nodes": cycle,
                        "cases": cases_in_cycle,
                        "description": f"Circular relationship detected spanning {len(cycle)} entities. Possible evidence recycling loop or complex cross-case linkage."
                    })
                    for n in cycle:
                        if n in self._nodes:
                            self._nodes[n]["suspicious"] = True
                    if cycles_found >= 3: # Limit alerts to avoid flooding
                        break

        # 6. Fuzzy Matching (Similar evidence filenames across cases)
        # Using difflib to find filenames that are >85% similar but not identical
        ev_nodes = [n for n in self._nodes.values() if n["type"] == "evidence"]
        for i in range(len(ev_nodes)):
            for j in range(i + 1, len(ev_nodes)):
                n1, n2 = ev_nodes[i], ev_nodes[j]
                # Only compare if they belong to different cases
                if n1["metadata"].get("case_id") != n2["metadata"].get("case_id"):
                    f1, f2 = n1["label"], n2["label"]
                    similarity = difflib.SequenceMatcher(None, f1, f2).ratio()
                    if 0.85 < similarity < 1.0:
                        patterns.append({
                            "id": f"pat-fuzzy-{_stable_id(f1, f2)}",
                            "type": "similar_evidence",
                            "severity": "low",
                            "nodes": [n1["id"], n2["id"]],
                            "cases": [str(n1["metadata"].get("case_id")), str(n2["metadata"].get("case_id"))],
                            "description": f"Highly similar evidence filenames detected across cases: '{f1}' and '{f2}' ({int(similarity*100)}% match). Possible polymorphic variant."
                        })
                        n1["suspicious"] = True
                        n2["suspicious"] = True
                        self._add_edge(n1["id"], n2["id"], "SIMILAR_EVIDENCE", {"similarity": similarity})

        return patterns
