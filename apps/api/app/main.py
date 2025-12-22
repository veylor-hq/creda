import os
from asyncio import run
from contextlib import asynccontextmanager
from datetime import time

from beanie import init_beanie
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from models.models import IncomeTransaction, Invoice, OTPActivationModel, Person, User, Workspace
from fastapi.middleware.cors import CORSMiddleware

from api.router import router as api_router
from app.core.config import config
from app.core.database import db
from app.core.email import send_email
from app.core.jwt import FastJWT


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_beanie(
        database=db,
        document_models=[
            User,
            Workspace,
            OTPActivationModel,
            Person,
            IncomeTransaction,
            Invoice
        ],
    )

    yield


def get_application():
    _app = FastAPI(title=config.PROJECT_NAME, lifespan=lifespan)

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=config.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return _app


app = get_application()


# health check
@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(api_router)
