import faiss
import numpy as np
import pickle
from pathlib import Path
from typing import List, Dict, Optional

class FAISSIndex:
    """FAISS vector store for semantic search"""
    
    def __init__(self, dimension: int = 384, index_path: str = "/app/ml-service/data"):
        self.dimension = dimension
        self.index_path = Path(index_path)
        self.index_path.mkdir(exist_ok=True)
        
        self.index_file = self.index_path / "faiss.index"
        self.metadata_file = self.index_path / "metadata.pkl"
        
        # Load or create index
        if self.index_file.exists():
            self.index = faiss.read_index(str(self.index_file))
            with open(self.metadata_file, 'rb') as f:
                self.metadata_store = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(dimension)
            self.metadata_store = []
    
    def add_embedding(self, embedding: np.ndarray, metadata: dict):
        """Add embedding with metadata"""
        embedding = embedding.reshape(1, -1).astype('float32')
        self.index.add(embedding)
        self.metadata_store.append(metadata)
        self._save()
    
    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Dict]:
        """Search for similar embeddings"""
        if self.index.ntotal == 0:
            return []
        
        query_embedding = query_embedding.reshape(1, -1).astype('float32')
        distances, indices = self.index.search(query_embedding, min(k, self.index.ntotal))
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.metadata_store):
                result = self.metadata_store[idx].copy()
                result["similarity_score"] = float(1 / (1 + distances[0][i]))
                results.append(result)
        
        return results
    
    def get_size(self) -> int:
        """Get number of vectors in index"""
        return self.index.ntotal
    
    def _save(self):
        """Save index and metadata to disk"""
        faiss.write_index(self.index, str(self.index_file))
        with open(self.metadata_file, 'wb') as f:
            pickle.dump(self.metadata_store, f)
