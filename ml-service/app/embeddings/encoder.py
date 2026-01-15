from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingEncoder:
    """Encode text into embeddings using sentence transformers"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self.dimension = 384  # Default for MiniLM
    
    def encode(self, text: str) -> np.ndarray:
        """Encode single text into embedding"""
        return self.model.encode([text])[0]
    
    def encode_batch(self, texts: list) -> np.ndarray:
        """Encode batch of texts"""
        return self.model.encode(texts)
