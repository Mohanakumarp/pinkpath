import os
from functools import lru_cache
from pathlib import Path

import chromadb
from llama_index.core import VectorStoreIndex, Settings, PromptTemplate
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding

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

# 1. Setup Models
ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")
ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
llm_request_timeout = float(os.getenv("OLLAMA_REQUEST_TIMEOUT", "120"))

llm = Ollama(model=ollama_model, request_timeout=llm_request_timeout)
embed_model = OllamaEmbedding(model_name=ollama_embed_model)

Settings.llm = llm
Settings.embed_model = embed_model

# 2. The Empathetic Persona Prompt
QA_PROMPT_TMPL = (
    "You are a highly empathetic, patient, and comforting support assistant for breast cancer patients.\n"
    "Your goal is to provide emotional support, listen to their fears, and provide factual information based ONLY on the provided context.\n"
    "Acknowledge their feelings. Never dismiss their fears. Keep your answers concise and conversational.\n"
    "CRITICAL RULE: You are not a doctor. Never diagnose, prescribe, or recommend specific treatments. Always gently advise them to speak with their oncologist for medical decisions.\n\n"
    "Context information is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Given the context information and not prior knowledge, answer the query.\n"
    "Patient: {query_str}\n"
    "Assistant: "
)
qa_prompt = PromptTemplate(QA_PROMPT_TMPL)

@lru_cache(maxsize=1)
def get_query_engine():
    # Locate the chroma_db folder we just built
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_dir = os.getenv("CHROMA_DB_DIR", os.path.join(base_dir, "chroma_db"))
    collection_name = os.getenv("CHROMA_COLLECTION_NAME", "pinkpath_support")

    # Connect to the existing database
    db = chromadb.PersistentClient(path=db_dir)
    chroma_collection = db.get_collection(collection_name)
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # Load the index directly from the local vectors
    index = VectorStoreIndex.from_vector_store(
        vector_store,
        embed_model=embed_model,
    )

    # Return an engine that retrieves the top 3 most relevant chunks
    query_engine = index.as_query_engine(
        similarity_top_k=3, 
        text_qa_template=qa_prompt
    )
    return query_engine

def ask_bot(question: str):
    try:
        engine = get_query_engine()
        response = engine.query(question)
        return str(response)
    except Exception:
        return (
            "I’m sorry, I’m having trouble reaching the local model right now. "
            f"Try again in a moment, or make sure `{ollama_model}` is pulled in Ollama."
        )