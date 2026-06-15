import os
from functools import lru_cache
from pathlib import Path
import chromadb

from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.core.llms import ChatMessage, MessageRole # Add this import!
# Remove ChatMemoryBuffer import completely

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

ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text:latest")

Settings.llm = Ollama(model=ollama_model, request_timeout=360.0, context_window=8192)
Settings.embed_model = OllamaEmbedding(model_name=ollama_embed_model, request_timeout=360.0)

SYSTEM_PROMPT = (
    "Your Name: Elara\n"
    "Your Creator: PinkPath\n"
    "Your Role: A warm, gentle, and empathetic AI companion.\n\n"
    "CRITICAL RULES:\n"
    "1. CHITCHAT OVERRIDE: If the user says 'hi', 'hello', 'thanks', or is just making polite conversation, DO NOT give medical disclaimers. Reply warmly and naturally like a friend.\n"
    "2. IDENTITY: YOU are Elara. NEVER call the user Elara.\n"
    "3. FORMAT: Write like a caring mobile text message. Keep it brief. No 'Dear' or 'Warmly'.\n"
    "4. SHARING MEDICAL INFO: ONLY if the user directly asks a medical question, share facts gently. Then add: 'I am an AI, not a doctor, please discuss this with your medical team.'\n"
    "5. NO REPETITION: Never repeat a medical disclaimer if you already said it recently."
)

# Rename to get_index (we only cache the database connection now, not the chat state)
@lru_cache(maxsize=1)
def get_index():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_dir = os.path.join(base_dir, "chroma_db")
    
    db = chromadb.PersistentClient(path=db_dir)
    chroma_collection = db.get_collection("knowledge_base")
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    
    return VectorStoreIndex.from_vector_store(vector_store=vector_store)

# Update function signature to accept history
async def ask_bot(question: str, history: list):
    try:
        index = get_index()
        
        # 1. Translate frontend history format into LlamaIndex format
        llama_history = []
        for msg in history:
            role = MessageRole.USER if msg.role == "user" else MessageRole.ASSISTANT
            llama_history.append(ChatMessage(role=role, content=msg.content))
            
        # 2. Spin up a fresh engine for this specific question, armed with the history
        chat_engine = index.as_chat_engine(
            chat_mode="condense_plus_context",
            system_prompt=SYSTEM_PROMPT,
            chat_history=llama_history, 
            similarity_top_k=3,
            verbose=True # Turn this on so you can see it rewrite questions in your terminal!
        )
        
        response = chat_engine.chat(question)
        
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