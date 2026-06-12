# backend/app/rag_engine.py
import os
from functools import lru_cache
from pathlib import Path
import chromadb

from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.core.memory import ChatMemoryBuffer # Gives Elara her memory

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

# 1. Setup Models (With 6-minute timeout AND 8192 context window)
ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text:latest")

Settings.llm = Ollama(model=ollama_model, request_timeout=360.0, context_window=8192)
Settings.embed_model = OllamaEmbedding(model_name=ollama_embed_model, request_timeout=360.0)

# 2. System Prompt for the Chat Engine
SYSTEM_PROMPT = (
    "You are the AI named Elara, created by PinkPath. The human speaking to you is the Patient. "
    "NEVER call the patient Elara. YOU are Elara.\n\n"
    "Your goal is to provide emotional support and factual information based ONLY on the retrieved context.\n"
    "You must obey these strict rules:\n"
    "1. FORMAT: Respond directly like a mobile text message. NEVER use letter formats like 'Dear [Name]', 'Sincerely', or 'Warmly'.\n"
    "2. IDENTITY: Never confuse yourself with the patient. You are the AI assistant.\n"
    "3. GREETINGS: If the user says 'hi', introduce yourself as Elara, made by PinkPath.\n"
    "4. NO MEDICAL ADVICE: You are NOT a doctor. If asked for a diagnosis or treatment advice, respond with empathy but advise them to speak with their oncologist.\n"
    "5. STAY ON TOPIC: Decline coding, math, or unrelated questions politely.\n"
    "6. TONE: Be conversational, kind, concise, and emotionally supportive."
)

@lru_cache(maxsize=1)
def get_chat_engine():
    # 1. Locate the local ChromaDB folder
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_dir = os.path.join(base_dir, "chroma_db")
    
    # 2. Connect to the local database
    db = chromadb.PersistentClient(path=db_dir)
    chroma_collection = db.get_collection("knowledge_base")
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    # 3. Load the index from the vectors
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

    # 4. Create Memory Buffer (Now safely remembers ~4000 tokens of conversation)
    memory = ChatMemoryBuffer.from_defaults(token_limit=4000)

    # 5. Return a CHAT engine instead of a Query engine
    chat_engine = index.as_chat_engine(
        chat_mode="context",
        memory=memory,
        system_prompt=SYSTEM_PROMPT,
        similarity_top_k=3
    )
    return chat_engine

# The main function your FastAPI route will call
async def ask_bot(question: str):
    try:
        engine = get_chat_engine()
        
        # USE .chat() INSTEAD OF .query() to utilize the memory buffer
        response = engine.chat(question)
        
        # Format the response to send back to the frontend
        return {
            "answer": str(response),
            "sources": [node.metadata for node in response.source_nodes]
        }
    except Exception as e:
        print(f"Error in ask_bot: {e}")
        return {
            "answer": "I’m sorry, I’m having trouble reaching my memory banks right now. Try again in a moment.",
            "sources": []
        }