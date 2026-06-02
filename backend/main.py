from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.rag_engine import ask_bot

app = FastAPI(title="PinkPath Support API")

# Allow the React Native frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define what the incoming data looks like
class ChatRequest(BaseModel):
    message: str

@app.get("/")
def health_check():
    return {"status": "active", "message": "PinkPath Backend is running."}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    # Pass the user's message to our RAG engine and get the answer
    bot_response = ask_bot(request.message)
    return {"response": bot_response}