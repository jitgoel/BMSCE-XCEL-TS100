import chromadb
from chromadb.config import Settings
import os

# Define local persistent directory for ChromaDB
CHROMA_PERSIST_DIR = os.getenv('CHROMA_PERSIST_DIR', './chroma_data')

class VectorStore:
    def __init__(self):
        # Initialize the persistent client
        self.client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        
        # Get or create collections for resumes and job descriptions
        self.resume_collection = self.client.get_or_create_collection(name="resumes")
        self.job_collection = self.client.get_or_create_collection(name="job_descriptions")

    def add_resume(self, resume_id, text_chunks, embeddings=None):
        """
        Store resume chunks in ChromaDB. Embeddings can be passed or generated via chromadb default func.
        """
        if embeddings:
            self.resume_collection.add(
                documents=text_chunks,
                embeddings=embeddings,
                ids=[f"res_{resume_id}_{i}" for i in range(len(text_chunks))],
                metadatas=[{"resume_id": resume_id} for _ in text_chunks]
            )
        else:
            self.resume_collection.add(
                documents=text_chunks,
                ids=[f"res_{resume_id}_{i}" for i in range(len(text_chunks))],
                metadatas=[{"resume_id": resume_id} for _ in text_chunks]
            )

    def query_resume_against_job(self, resume_id, job_query_text, n_results=5):
        """
        Finds the closest semantic matches in the stored resume for a given job requirement snippet.
        """
        results = self.resume_collection.query(
            query_texts=[job_query_text],
            n_results=n_results,
            where={"resume_id": resume_id}
        )
        return results

# Singleton instance
vector_store = VectorStore()
