import os
from pathlib import Path

from google import genai
from google.genai import types
from google.genai.errors import APIError

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

# Initialize the new Client
client = genai.Client()

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

chat_config = types.GenerateContentConfig(
    system_instruction=SYSTEM_PROMPT,
)

MODEL_ID = "gemini-3.1-flash-lite"

async def ask_bot(question: str, history: list):
    try:
        gemini_history = []
        for msg in history:
            # --- SAFE ATTRIBUTE EXTRACTION ---
            # Handles both Pydantic/ORM objects and native dicts seamlessly
            role_val = msg.role if hasattr(msg, 'role') else msg.get('role', 'user')
            content_val = msg.content if hasattr(msg, 'content') else msg.get('content', '')
            
            if not content_val or not str(content_val).strip():
                continue
            
            # The new SDK strictly expects 'user' or 'model'
            role = "user" if role_val == "user" else "model"
            
            gemini_history.append(
                types.Content(
                    role=role, 
                    parts=[types.Part.from_text(text=str(content_val))]
                )
            )
            
        # Gemini STRICTLY requires that chat history begins with the "user".
        while gemini_history and gemini_history[0].role == "model":
            gemini_history.pop(0)

        chat = client.aio.chats.create(
            model=MODEL_ID,
            config=chat_config,
            history=gemini_history
        )
        
        response = await chat.send_message(question)
        
        return {
            "answer": response.text,
            "sources": [] 
        }
        
    except APIError as e:
        print(f"\n❌ GEMINI API ERROR [{e.code}]: {e.message}\n")
        if e.code == 429:
            return {"answer": "Elara is helping a lot of people right now and I need a quick breather. Please try sending your message again in just a minute. 🌸", "sources": []}
        elif e.code >= 500:
            return {"answer": "I'm having a little trouble connecting to my thoughts right now. Give me just a moment and try again.", "sources": []}
        elif e.code == 400:
            return {"answer": "I seem to have lost my train of thought! Could we start a new conversation?", "sources": []}
        else:
            return {"answer": "I’m having a little trouble connecting right now. Please give me a moment and try again.", "sources": []}
            
    except Exception as e:
        print(f"\n🚨 PYTHON CRASH in ask_bot: {str(e)}\n")
        return {
            "answer": "I’m having a little trouble connecting right now. Please give me a moment and try again.",
            "sources": []
        }