#backend\app\rag_engine.py
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
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

_load_local_env()

# 1. Setup Models
ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")
ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text:latest")

Settings.llm = Ollama(model=ollama_model)
Settings.embed_model = OllamaEmbedding(model_name=ollama_embed_model)

# 2. The Empathetic Persona Prompt
QA_PROMPT_TMPL = (
    "You are PinkPath, a highly empathetic, patient, and comforting support assistant for breast cancer patients.\n"
    "Your goal is to provide emotional support and factual information based ONLY on the provided context.\n"
    "Acknowledge their feelings gently. Keep your answers concise and conversational.\n"
    "You must obey these strict rules:\n"
    "1. GREETINGS: If the user just says 'hi' or 'hello', warmly introduce yourself as PinkPath and ask how you can support them. Never mention files, documents, or 'context'.\n"
    "2. NO MEDICAL ADVICE: You are NOT a doctor. If the user asks for a diagnosis, which medication to take, or treatment advice, you must respond with deep empathy but firmly advise them to speak with their oncologist.\n"
    "3. STAY ON TOPIC: If the user asks about coding, Python, math, or anything unrelated to breast cancer support, politely decline and remind them of your purpose.\n"
    "4. TONE: Always be conversational, kind, and emotionally supportive.\n\n"
    "Context information from official medical guidelines is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Given the context information and not prior knowledge, answer the query.\n"
    "Patient: {query_str}\n"
    "PinkPath: "
)
qa_prompt = PromptTemplate(QA_PROMPT_TMPL)

@lru_cache(maxsize=1)
def get_query_engine():
    # 1. Locate the local ChromaDB folder we just built
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_dir = os.path.join(base_dir, "chroma_db")
    
    # 2. Connect to the local database
    db = chromadb.PersistentClient(path=db_dir)
    chroma_collection = db.get_collection("knowledge_base")
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # 3. Load the index from the vectors
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

    # 4. Return an engine that retrieves the top 3 most relevant PDF chunks
    query_engine = index.as_query_engine(
        similarity_top_k=3, 
        text_qa_template=qa_prompt
    )
    return query_engine

# The main function your FastAPI route will call
async def ask_bot(question: str):
    try:
        engine = get_query_engine()
        response = engine.query(question)
        
        # Format the response to send back to the frontend
        return {
            "answer": str(response),
            "sources": [node.metadata for node in response.source_nodes]
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            "answer": "I’m sorry, I’m having trouble reaching my memory banks right now. Try again in a moment.",
            "sources": []
        }