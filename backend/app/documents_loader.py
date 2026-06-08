# backend\app\documents_loader.py
import os
from pathlib import Path
import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding  # Swapped back to Ollama

def _load_local_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

_load_local_env()

# 1. The Local Brain
Settings.llm = Ollama(model=os.getenv("OLLAMA_INGEST_MODEL", "phi3:latest"))

# 2. Optimized Ollama Nomic Embedding Setup
Settings.embed_model = OllamaEmbedding(
    model_name=os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text:latest")
    # embed_batch_size=100  # Safe batching to prevent Windows socket exhaustion
)
Settings.chunk_size = 512
Settings.chunk_overlap = 50

def ingest_documents():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.getenv("DATA_DIR", os.path.join(base_dir, "data"))
    db_dir = os.path.join(base_dir, "chroma_db")
    
    print(f"Searching for PDFs in: {data_dir}")
    if not os.path.exists(data_dir) or not os.listdir(data_dir):
        print("Error: No files found in the data directory!")
        return

    # Filter strictly for PDF files
    documents = SimpleDirectoryReader(
        input_dir=data_dir,
        required_exts=[".pdf"]
    ).load_data()
    
    if not documents:
        print("Error: No PDF files found to ingest!")
        return
        
    print(f"Successfully loaded {len(documents)} PDF pages/chunks.")

    print("Initializing Local ChromaDB...")
    db = chromadb.PersistentClient(path=db_dir)
    chroma_collection = db.get_or_create_collection("knowledge_base")
    
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    print("Embedding documents and saving locally to ChromaDB via Nomic...")
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True
    )
    
    print(f"Ingestion complete! Knowledge base is saved locally in: {db_dir}")

if __name__ == "__main__":
    ingest_documents()