from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import hashlib
import time
import os

app = FastAPI()

# Enable CORS so your React frontend can talk to this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def run_forensic_pipeline(file: UploadFile = File(...)):
    try:
        # Step 1: Identification (Read file and Hash it)
        content = await file.read()
        sha256_hash = hashlib.sha256(content).hexdigest()

        # Step 2: Preservation & Collection (Simulated metadata extraction)
        file_size = len(content)
        
        # Step 3: Automated Analysis (Simulating deep scan)
        # In a real expert scenario, you would call 'sleuthkit' or 'volatility' here
        time.sleep(2) # Simulating processing time for the "Expert" feel
        
        return {
            "id": f"CASE-{int(time.time())}",
            "filename": file.filename,
            "hash": f"SHA256: {sha256_hash}",
            "size": f"{file_size} bytes",
            "status": "COMPLETED",
            "report_generated": True,
            "findings": "No malicious artifacts detected in initial triage."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)