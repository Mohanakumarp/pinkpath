# backend\app\api_routes.py
import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
# Import your Chatbot engine
from app.rag_engine import ask_bot 
load_dotenv()
# --- INITIALIZE SUPABASE HERE ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials are not set in the .env file")

# 1. The standard client (used for auth, will downgrade its privileges)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. The admin client (strictly for bypassing RLS to insert data)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# --- START ROUTER ---
router = APIRouter()

# --- PYDANTIC MODELS ---
class RegisterRequest(BaseModel):
    email: str
    password: str
    phone_number: str
    name: str # Add this line

class LoginRequest(BaseModel):
    email: str
    password: str

class CheckInRequest(BaseModel):
    user_id: str
    intensity_level: str
    specific_emotion: str
    cause_category: str

class ChatRequest(BaseModel):
    message: str

# --- 1. AUTHENTICATION ROUTES ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(register_data: RegisterRequest):
    try:
        # Step 1: Create the secure account
        auth_response = supabase.auth.sign_up({
            "email": register_data.email,
            "password": register_data.password
        })
        
        # --- THE FIX: Catch the fake user object ---
        # If identities is empty, the email was already taken!
        if auth_response.user and not auth_response.user.identities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="This email is already registered. Please log in."
            )
            
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Registration failed."
            )
            
        user_id = auth_response.user.id
        
        # Step 2: Insert into public.users
        profile_data = {
            "id": user_id,
            "phone_number": register_data.phone_number,
            "name": register_data.name
        }
        
        supabase_admin.table("users").insert(profile_data).execute()
        
        return {
            "status": "success", 
            "message": "User registered successfully",
            "user": {
                "id": user_id,
                "email": register_data.email,
                "name": register_data.name,
                "phone_number": register_data.phone_number
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login")
async def login_user(login_data: LoginRequest):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": login_data.email,
            "password": login_data.password
        })
        
        user_id = auth_response.user.id
        profile_response = supabase.table("users").select("*").eq("id", user_id).execute()
        
        return {
            "status": "success",
            "user": {
                "id": user_id,
                "email": login_data.email,
                "profile": profile_response.data[0] if profile_response.data else {}
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. " + str(e)
        )

# --- 2. CHECK-IN ROUTES ---
@router.post("/checkins")
async def create_checkin(checkin: CheckInRequest):
    try:
        data = checkin.dict()
        # FIX 1: Change supabase to supabase_admin
        result = supabase_admin.table("check_ins").insert(data).execute() 
        
        return {
            "message": "Check-in saved successfully", 
            "data": result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/checkins/{user_id}")
async def get_checkins(user_id: str):
    try:
        # FIX 2: Change supabase to supabase_admin
        result = supabase_admin.table("check_ins").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return {
            "status": "success", 
            "checkins": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 3. PROFILE ROUTE ---
@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    try:
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        return {
            "status": "success", 
            "profile": result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 4. CHATBOT ROUTES ---
@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    bot_response = await ask_bot(request.message)
    
    return {
        "response": bot_response["answer"],
        "sources": bot_response["sources"]
    }