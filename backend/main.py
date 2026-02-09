from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import chat
from src import auth

app = FastAPI()

# --- CRITICAL SECURITY FIX (CORS) ---
# This tells the server: "Allow the frontend at localhost:5173 to talk to me"
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins (good for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(chat.router, prefix="/api/v1/chats")
app.include_router(auth.router, prefix="/api/v1/auth")

@app.get("/")
def read_root():
    return {"status": "Backend is running"}