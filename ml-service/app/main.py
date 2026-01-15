from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

# Only import analytics engine for now (RAG components not needed yet)
from app.analytics.insights_engine import InsightsEngine

load_dotenv()

app = FastAPI(title="Fleet Operations ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
insights_engine = InsightsEngine()

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
    """Add document to vector store"""
    try:
        embedding = encoder.encode(doc.content)
        
        metadata = {
            "content": doc.content,
            "doc_type": doc.doc_type,
            "campaign_id": doc.campaign_id,
            "metadata": doc.metadata or {}
        }
        
        faiss_index.add_embedding(embedding, metadata)
        
        return {
            "message": "Document added successfully",
            "index_size": faiss_index.get_size()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search_similar(query: QueryInput):
    """Search for similar documents"""
    try:
        results = await rag_retriever.search(query.query, query.top_k)
        return {"results": results, "query": query.query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/insights/generate")
async def generate_insights(request: InsightRequest):
    """Generate AI insights"""
    try:
        insights = await rag_retriever.generate_insights(
            request.query_type,
            request.campaign_id
        )
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """Get ML service statistics"""
    return {
        "total_documents": faiss_index.get_size(),
        "model": encoder.model_name,
        "dimension": encoder.dimension
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-rag-service"}
# ============================================================
# ANALYTICS & INSIGHTS ENDPOINTS (Admin-only via backend)
# ============================================================

class AnalyticsRequest(BaseModel):
    campaigns: List[Dict[str, Any]] = []
    expenses: List[Dict[str, Any]] = []
    vehicles: List[Dict[str, Any]] = []
    drivers: List[Dict[str, Any]] = []
    vendors: List[Dict[str, Any]] = []

@app.post("/analytics/campaign-insights")
async def get_campaign_insights(request: AnalyticsRequest):
    """Analyze campaign performance and provide insights"""
    try:
        insights = await insights_engine.analyze_campaign_performance(request.campaigns)
        return {
            "success": True,
            "insights": [insight.model_dump() for insight in insights]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing campaigns: {str(e)}")

@app.post("/analytics/expense-anomalies")
async def detect_expense_anomalies(request: AnalyticsRequest):
    """Detect anomalous expenses"""
    try:
        anomalies = await insights_engine.detect_expense_anomalies(request.expenses)
        return {
            "success": True,
            "anomalies": [anomaly.model_dump() for anomaly in anomalies]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies: {str(e)}")

@app.post("/analytics/vehicle-utilization")
async def get_vehicle_utilization(request: AnalyticsRequest):
    """Analyze vehicle utilization"""
    try:
        utilization = await insights_engine.analyze_utilization(request.vehicles, "vehicle")
        return {
            "success": True,
            "utilization": [u.model_dump() for u in utilization]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing utilization: {str(e)}")

@app.post("/analytics/driver-utilization")
async def get_driver_utilization(request: AnalyticsRequest):
    """Analyze driver utilization"""
    try:
        utilization = await insights_engine.analyze_utilization(request.drivers, "driver")
        return {
            "success": True,
            "utilization": [u.model_dump() for u in utilization]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing utilization: {str(e)}")

@app.post("/analytics/vendor-performance")
async def get_vendor_performance(request: AnalyticsRequest):
    """Analyze vendor performance"""
    try:
        performance = await insights_engine.analyze_vendor_performance(request.vendors)
        return {
            "success": True,
            "performance": [p.model_dump() for p in performance]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing vendor performance: {str(e)}")

@app.post("/analytics/dashboard")
async def get_analytics_dashboard(request: AnalyticsRequest):
    """Generate comprehensive analytics dashboard"""
    try:
        dashboard = await insights_engine.generate_summary_dashboard(
            campaigns=request.campaigns,
            expenses=request.expenses,
            vehicles=request.vehicles,
            drivers=request.drivers,
            vendors=request.vendors
        )
        return {
            "success": True,
            "dashboard": dashboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating dashboard: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
