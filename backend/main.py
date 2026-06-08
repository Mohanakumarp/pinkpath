from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your custom modules
from app.database import connect_to_mongo, close_mongo_connection
from app.api_routes import router as api_router # Imports ALL your routes now!

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

# 3. Handle Database Connections on Startup/Shutdown
@app.on_event("startup")
async def startup_db_client():
    connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    close_mongo_connection()

# 4. Mount ALL Routes (/register, /login, and /chat)
app.include_router(api_router)

# 5. Simple Health Check for the Server Root
@app.get("/")
def health_check():
    return {"status": "active", "message": "PinkPath Backend is running perfectly."}