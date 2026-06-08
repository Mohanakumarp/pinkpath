# backend\app\database.py
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Safely pull the URI, or use a local fallback so the app never crashes!
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/pinkpath_db")
DB_NAME = os.getenv("DB_NAME", "pinkpath_db")

client = None
db = None

def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    print("Connected to MongoDB Atlas successfully!")

def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")