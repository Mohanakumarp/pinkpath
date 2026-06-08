from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.models.user import UserRegister, UserResponse
from app.utils.auth import hash_password, verify_password
import app.database as database

# Import your chatbot engine!
from app.rag_engine import ask_bot 

router = APIRouter()

# --- AUTHENTICATION ROUTES ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserRegister):
    existing_user = await database.db["users"].find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_data = user_in.dict()
    plain_password = user_data.pop("password")
    user_data["hashed_password"] = hash_password(plain_password)
    user_data["created_at"] = user_in.diagnosis_date or None
    
    result = await database.db["users"].insert_one(user_data)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

@router.post("/login")
async def login_user(login_data: dict):
    email = login_data.get("email")
    password = login_data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password")
        
    user = await database.db["users"].find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    return {
        "status": "success",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "treatment_phase": user["treatment_phase"]
        }
    }


# --- CHATBOT ROUTES ---

# Define the expected JSON body for the chat
class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # Pass the message to the local RAG engine
    bot_response = await ask_bot(request.message)
    
    return {
        "response": bot_response["answer"],
        "sources": bot_response["sources"]
    }