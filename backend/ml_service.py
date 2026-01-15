from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import numpy as np
import faiss
import pickle
from pathlib import Path
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="Fleet Operations ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FAISS_INDEX_PATH = "/app/faiss_data/fleet_index.faiss"
METADATA_PATH = "/app/faiss_data/metadata.pkl"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

os.makedirs("/app/faiss_data", exist_ok=True)

embedding_model = SentenceTransformer(EMBEDDING_MODEL)
dimension = 384

if os.path.exists(FAISS_INDEX_PATH):
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(METADATA_PATH, 'rb') as f:
        metadata_store = pickle.load(f)
else:
    index = faiss.IndexFlatL2(dimension)
    metadata_store = []

class DocumentInput(BaseModel):
    content: str
    doc_type: str
    campaign_id: Optional[int] = None
    metadata: Optional[dict] = None

class QueryInput(BaseModel):
    query: str
    top_k: int = 5

class InsightRequest(BaseModel):
    campaign_id: Optional[int] = None
    query_type: str

@app.post("/embed/add")
async def add_document(doc: DocumentInput):
    try:
        embedding = embedding_model.encode([doc.content])[0]
        
        index.add(np.array([embedding], dtype=np.float32))
        
        metadata = {
            "content": doc.content,
            "doc_type": doc.doc_type,
            "campaign_id": doc.campaign_id,
            "metadata": doc.metadata or {},
            "timestamp": datetime.now().isoformat()
        }
        metadata_store.append(metadata)
        
        faiss.write_index(index, FAISS_INDEX_PATH)
        with open(METADATA_PATH, 'wb') as f:
            pickle.dump(metadata_store, f)
        
        return {"message": "Document added successfully", "index_size": index.ntotal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_similar(query: QueryInput):
    try:
        if index.ntotal == 0:
            return {"results": [], "message": "No documents in index"}
        
        query_embedding = embedding_model.encode([query.query])[0]
        
        distances, indices = index.search(np.array([query_embedding], dtype=np.float32), min(query.top_k, index.ntotal))
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(metadata_store):
                result = metadata_store[idx].copy()
                result["similarity_score"] = float(1 / (1 + distances[0][i]))
                results.append(result)
        
        return {"results": results, "query": query.query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/insights/generate")
async def generate_insights(request: InsightRequest):
    try:
        if request.query_type == "budget_overrun":
            query = f"campaign {request.campaign_id or ''} budget expenses cost overrun analysis"
        elif request.query_type == "driver_performance":
            query = "driver performance issues delays problems"
        elif request.query_type == "execution_summary":
            query = f"campaign {request.campaign_id or ''} execution summary report"
        else:
            query = request.query_type
        
        if index.ntotal == 0:
            return {
                "insight": "No data available for analysis. Please add campaign data first.",
                "sources": []
            }
        
        query_embedding = embedding_model.encode([query])[0]
        distances, indices = index.search(np.array([query_embedding], dtype=np.float32), min(3, index.ntotal))
        
        sources = []
        for i, idx in enumerate(indices[0]):
            if idx < len(metadata_store):
                sources.append(metadata_store[idx])
        
        insight = f"Based on {len(sources)} relevant data points, analysis shows trends related to {request.query_type}."
        
        if request.query_type == "budget_overrun" and sources:
            insight = "Budget analysis indicates tracking expenses against allocated budget. Monitor high-cost items."
        elif request.query_type == "driver_performance" and sources:
            insight = "Driver performance metrics available. Review completion rates and feedback."
        
        return {
            "insight": insight,
            "sources": sources,
            "query_type": request.query_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    return {
        "total_documents": index.ntotal,
        "index_dimension": dimension,
        "model": EMBEDDING_MODEL
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-rag-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
