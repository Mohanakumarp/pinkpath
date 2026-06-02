import os
from pathlib import Path
import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama

def _load_local_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_local_env()

# 1. Configure Local Models (Strictly Private)
# We will use Llama 3.1 for text generation and nomic-embed-text for creating vectors
Settings.llm = Ollama(
    model=os.getenv("OLLAMA_INGEST_MODEL", "llama3.1"),
    request_timeout=float(os.getenv("OLLAMA_INGEST_TIMEOUT", "360.0")),
)
Settings.embed_model = OllamaEmbedding(
    model_name=os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
)

# 2. Optimize Chunking for Clinical Text
# 512 tokens is a good sweet spot for keeping medical context intact
Settings.chunk_size = 512
Settings.chunk_overlap = 50

def ingest_documents():
    # Resolve absolute paths based on the script location
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.getenv("DATA_DIR", os.path.join(base_dir, "data"))
    db_dir = os.getenv("CHROMA_DB_DIR", os.path.join(base_dir, "chroma_db"))
    collection_name = os.getenv("CHROMA_COLLECTION_NAME", "pinkpath_support")

    print(f"Loading PDFs from: {data_dir}")
    
    # Load all PDFs from the data folder
    documents = SimpleDirectoryReader(input_dir=data_dir).load_data()
    print(f"Successfully loaded {len(documents)} pages/chunks.")

    print("Initializing local ChromaDB...")
    # Create or connect to the local ChromaDB database
    db = chromadb.PersistentClient(path=db_dir)
    chroma_collection = db.get_or_create_collection(collection_name)

    # Assign Chroma as our storage backend
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    print("Embedding documents and saving to ChromaDB...")
    print("Grab a coffee; this might take a few minutes depending on PDF size.")
    
    # This processes the text, embeds it using Ollama, and saves it
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True
    )
    
    print("Ingestion complete! Your knowledge base is ready in /chroma_db.")

if __name__ == "__main__":
    ingest_documents()