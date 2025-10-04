from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Intern-Galing AI Service",
    description="LLT + Sentiment Analysis for Internship Evaluations.",
    version="1.0.0"
)

# Cors configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get('/')
async def root():
    return {
        "message": "Intern-Galing AI Service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "service": "ai-service"
    }

# Placeholder for LLT evaluation endpoint
@app.post("/api/evaluate")
async def evaluate_feedback(data: dict):
    """
    Placeholder for LLT + Sentiment Analysis
    Will be implemented in Phase 2
    """
    return {
        "status": "success",
        "message": "Evaluation endpoint - Coming in Phase 2",
        "data": data
    }

# Run Server
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )