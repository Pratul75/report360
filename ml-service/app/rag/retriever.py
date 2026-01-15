from typing import List, Dict, Optional
from app.embeddings.encoder import EmbeddingEncoder
from app.vector_store.faiss_index import FAISSIndex

class RAGRetriever:
    """RAG-based retrieval and generation"""
    
    def __init__(self, encoder: EmbeddingEncoder, faiss_index: FAISSIndex):
        self.encoder = encoder
        self.faiss_index = faiss_index
    
    async def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search for relevant documents"""
        query_embedding = self.encoder.encode(query)
        results = self.faiss_index.search(query_embedding, top_k)
        return results
    
    async def generate_insights(self, query_type: str, campaign_id: Optional[int] = None) -> Dict:
        """Generate insights based on query type"""
        
        # Map query types to search queries
        query_map = {
            "budget_overrun": f"campaign {campaign_id or ''} budget expenses cost overrun analysis",
            "driver_performance": "driver performance issues delays problems",
            "execution_summary": f"campaign {campaign_id or ''} execution summary report",
        }
        
        query = query_map.get(query_type, query_type)
        
        # Search for relevant documents
        results = await self.search(query, top_k=3)
        
        # Generate insight based on results
        if not results:
            insight = "No data available for analysis. Please add campaign data first."
        elif query_type == "budget_overrun":
            insight = "Budget analysis indicates tracking expenses against allocated budget. Monitor high-cost items."
        elif query_type == "driver_performance":
            insight = "Driver performance metrics available. Review completion rates and feedback."
        else:
            insight = f"Based on {len(results)} relevant data points, analysis shows trends related to {query_type}."
        
        return {
            "insight": insight,
            "sources": results,
            "query_type": query_type
        }
