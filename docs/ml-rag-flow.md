# ML/RAG Flow Documentation

## Overview

The ML service provides AI-powered insights using FAISS vector database and Retrieval Augmented Generation (RAG).

## Architecture

```
ML Service Components:
├── Embedding Encoder (Sentence Transformers)
├── FAISS Vector Store
├── RAG Retriever
└── Insight Generator
```

## Data Flow

### 1. Document Ingestion

```
Backend → ML Service → Embedding → FAISS
```

**What gets ingested:**
- Campaign reports
- Expense records
- Driver logs
- Execution notes
- GPS data summaries

### 2. Query Processing

```
User Query → Embedding → FAISS Search → Context Retrieval → LLM Generation → Insights
```

## Use Cases

### 1. Budget Overrun Analysis

**Query:** "Why did Campaign X exceed budget?"

**Process:**
1. Encode query into embedding
2. Search FAISS for similar expense patterns
3. Retrieve relevant expense records
4. Generate insight with context

**Output:**
```json
{
  "insight": "Campaign exceeded budget primarily due to unexpected fuel costs (+25%) and extended execution days (+5 days). Historical data shows similar patterns in monsoon season.",
  "sources": [
    {"doc_type": "expense", "amount": 45000, "type": "fuel"},
    {"doc_type": "report", "extra_days": 5}
  ]
}
```

### 2. Driver Performance Issues

**Query:** "Show drivers with performance issues last 7 days"

**Process:**
1. Search for negative performance indicators
2. Aggregate driver-related issues
3. Rank by severity

**Output:**
```json
{
  "insight": "3 drivers reported delays: Driver A (2 delays, fuel issues), Driver B (1 delay, vehicle breakdown), Driver C (3 delays, traffic)",
  "sources": [...]
}
```

### 3. Campaign Execution Summary

**Query:** "Summarize campaign execution for Campaign Y"

**Output:**
```json
{
  "insight": "Campaign Y completed 95% of planned locations, 12 vehicles deployed, 450 KM covered, 89% on-time delivery rate. Minor delays in South zone due to weather.",
  "sources": [...]
}
```

## API Endpoints

### POST /embed/add
Add document to vector store

```python
{
  "content": "Campaign Mumbai completed with 98% success rate...",
  "doc_type": "report",
  "campaign_id": 123,
  "metadata": {"date": "2025-01-15"}
}
```

### POST /search
Search for similar documents

```python
{
  "query": "high expense campaigns",
  "top_k": 5
}
```

### POST /insights/generate
Generate AI insights

```python
{
  "campaign_id": 123,
  "query_type": "budget_overrun"
}
```

## Models Used

### Embedding Model
- **Model:** all-MiniLM-L6-v2
- **Dimension:** 384
- **Speed:** Fast (suitable for production)
- **Quality:** Good for semantic search

### Alternative Models (Future)
- **all-mpnet-base-v2** - Higher quality, slower
- **multi-qa-mpnet-base-dot-v1** - Optimized for Q&A

## Integration with Backend

```python
# In backend service
import httpx

ML_SERVICE_URL = "http://localhost:8002"

async def ingest_report(report_data):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{ML_SERVICE_URL}/embed/add",
            json={
                "content": report_data["notes"],
                "doc_type": "report",
                "campaign_id": report_data["campaign_id"]
            }
        )
```

## Performance Optimization

1. **Batch Processing** - Ingest documents in batches
2. **Caching** - Cache frequent queries
3. **Index Optimization** - Periodic FAISS index optimization
4. **Async Operations** - Non-blocking ML operations

## Scaling Considerations

- **FAISS Clustering** - Use IVF for large datasets
- **Distributed Search** - Shard index across multiple nodes
- **GPU Acceleration** - Use faiss-gpu for faster search
- **Model Serving** - Dedicated embedding service

## Future Enhancements

- [ ] Fine-tune embeddings on fleet domain data
- [ ] Add GPT-4 integration for advanced insights
- [ ] Real-time anomaly detection
- [ ] Predictive analytics (budget forecasting)
- [ ] Multi-language support
