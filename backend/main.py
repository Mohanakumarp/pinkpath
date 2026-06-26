# backend\main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# import uvicorn
# Import your routes (which now handle the Supabase initialization internally)
from app.api_routes import router as api_router 

# 1. Initialize the app exactly ONCE
app = FastAPI(title="PinkPath Support API")

# 2. Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount ALL Routes (/login, /checkins, /profile, and /chat)
app.include_router(api_router)

# 4. Simple Health Check for the Server Root
@app.get("/")
def health_check():
    return {"status": "active", "message": "PinkPath Backend is running perfectly with Supabase."}

# if __name__=="__main__":
#     uvicorn.run(app="main:app",host="0.0.0.0",port=8000,reload=True)