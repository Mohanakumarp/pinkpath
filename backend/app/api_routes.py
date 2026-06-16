# backend/app/api_routes.py
import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import List, Optional

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
    name: str 

class LoginRequest(BaseModel):
    email: str
    password: str

# ADD THIS NEW MODEL FOR PASSWORD UPDATES
class UpdatePasswordRequest(BaseModel):
    user_id: str
    new_password: str

class CheckInRequest(BaseModel):
    user_id: str
    intensity_level: str
    specific_emotion: str
    cause_category: str
    created_at: Optional[str]=None

class ChatMessageItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessageItem] = [] 

class CreatePostRequest(BaseModel):
    user_id: str
    title: str
    content: str
    category: str = "General"
    is_anonymous: bool = False

class CreateCommentRequest(BaseModel):
    post_id: str
    user_id: str
    content: str
    is_anonymous: bool = False

# --- 1. AUTHENTICATION ROUTES ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(register_data: RegisterRequest):
    try:
        auth_response = supabase.auth.sign_up({
            "email": register_data.email,
            "password": register_data.password
        })
        
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

# ADD THIS NEW ROUTE FOR PASSWORD UPDATES
@router.post("/update-password")
async def update_password(req: UpdatePasswordRequest):
    try:
        # Use the admin client to securely update the user's password using their ID
        supabase_admin.auth.admin.update_user_by_id(
            req.user_id,
            {"password": req.new_password}
        )
        return {"status": "success", "message": "Password updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 2. CHECK-IN ROUTES ---
@router.post("/checkins")
async def create_checkin(checkin: CheckInRequest):
    try:
        data = checkin.dict(exclude_none=True)
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
    bot_response = await ask_bot(request.message, request.history)
    
    return {
        "response": bot_response["answer"],
        "sources": bot_response["sources"]
    }

# --- 5. COMMUNITY FORUM ROUTES ---

@router.post("/community/posts")
async def create_community_post(post: CreatePostRequest):
    try:
        data = post.dict()
        # Insert the post using the admin client
        result = supabase_admin.table("community_posts").insert(data).execute()
        
        return {
            "status": "success",
            "message": "Post created successfully",
            "post": result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/community/posts")
async def get_community_feed():
    try:
        # Fetch all posts, and securely join the users table to get the author's name
        # We order by created_at descending so the newest posts are at the top
        result = supabase_admin.table("community_posts").select(
            "*, users(name)"
        ).order("created_at", desc=True).execute()
        
        posts = result.data
        
        # 🚨 SECURITY SCRUB: Enforce Anonymity
        for post in posts:
            if post.get("is_anonymous") == True:
                # Overwrite the user data so the frontend never even sees the real name
                post["users"] = {"name": "Anonymous"}
                
        return {
            "status": "success",
            "posts": posts
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/community/posts/{post_id}")
async def get_post_and_comments(post_id: str):
    try:
        # 1. Fetch the specific post
        post_result = supabase_admin.table("community_posts").select(
            "*, users(name)"
        ).eq("id", post_id).execute()
        
        if not post_result.data:
            raise HTTPException(status_code=404, detail="Post not found")
            
        post = post_result.data[0]
        
        # Scrub post anonymity
        if post.get("is_anonymous") == True:
            post["users"] = {"name": "Anonymous"}

        # 2. Fetch all comments for this post
        comments_result = supabase_admin.table("community_comments").select(
            "*, users(name)"
        ).eq("post_id", post_id).order("created_at", desc=False).execute()
        
        comments = comments_result.data
        
        # Scrub comment anonymity
        for comment in comments:
            if comment.get("is_anonymous") == True:
                comment["users"] = {"name": "Anonymous"}
                
        return {
            "status": "success",
            "post": post,
            "comments": comments
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/community/comments")
async def create_comment(comment: CreateCommentRequest):
    try:
        data = comment.dict()
        result = supabase_admin.table("community_comments").insert(data).execute()
        
        return {
            "status": "success",
            "message": "Comment added successfully",
            "comment": result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/community/posts/{post_id}/upvote")
async def upvote_post(post_id: str):
    try:
        # First, get the current upvote count
        post = supabase_admin.table("community_posts").select("upvotes").eq("id", post_id).execute()
        if not post.data:
            raise HTTPException(status_code=404, detail="Post not found")
            
        current_upvotes = post.data[0].get("upvotes", 0)
        
        # Increment by 1 and update
        result = supabase_admin.table("community_posts").update(
            {"upvotes": current_upvotes + 1}
        ).eq("id", post_id).execute()
        
        return {
            "status": "success",
            "upvotes": result.data[0]["upvotes"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))