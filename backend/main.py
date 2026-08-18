"""Synaptix AI — FastAPI Backend."""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database.db import db_exists
from database.seed import seed_database
from routes.dashboard import router as dashboard_router
from routes.analytics import router as analytics_router
from routes.inventory import router as inventory_router
from routes.customers import router as customers_router
from routes.forecasts import router as forecasts_router
from routes.chat import router as chat_router
from routes.actions import router as actions_router
from routes.data import router as data_router
from routes.leakage import router as leakage_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed database on startup if it doesn't exist."""
    if not db_exists():
        print("Seeding database...")
        seed_database()
    yield


app = FastAPI(
    title="Synaptix AI",
    description="AI-powered Business Operations Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(inventory_router)
app.include_router(customers_router)
app.include_router(forecasts_router)
app.include_router(chat_router)
app.include_router(actions_router)
app.include_router(data_router)
app.include_router(leakage_router)


@app.get("/")
async def root():
    return {"name": "Synaptix AI", "version": "1.0.0", "status": "running"}


@app.get("/api/health")
async def health():
    return {"status": "healthy", "database": db_exists()}
