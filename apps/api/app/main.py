import os
from asyncio import run
from contextlib import asynccontextmanager
from datetime import time

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from prometheus_fastapi_instrumentator import Instrumentator
from beanie import init_beanie
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from models.models import IncomeTransaction, Invoice, OTPActivationModel, PasswordResetToken, Person, User, Workspace, WorkspaceInvite, WorkspaceReactivationToken
from fastapi.middleware.cors import CORSMiddleware

from api.router import router as api_router
from app.core.config import config
from app.core.database import db
from app.core.email import send_email
from app.core.jwt import FastJWT


def init_sentry() -> None:
    if not config.SENTRY_DSN:
        return

    sentry_sdk.init(
        dsn=config.SENTRY_DSN,
        environment=config.SENTRY_ENVIRONMENT or config.ENV,
        traces_sample_rate=config.SENTRY_TRACES_SAMPLE_RATE,
        integrations=[FastApiIntegration(), StarletteIntegration()],
        send_default_pii=False,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_beanie(
        database=db,
        document_models=[
            User,
            Workspace,
            WorkspaceInvite,
            OTPActivationModel,
            PasswordResetToken,
            WorkspaceReactivationToken,
            Person,
            IncomeTransaction,
            Invoice
        ],
    )

    yield


def get_application():
    init_sentry()
    _app = FastAPI(title=config.PROJECT_NAME, lifespan=lifespan)

    @_app.middleware("http")
    async def metrics_auth_middleware(request: Request, call_next):
        if request.url.path == "/metrics" and config.METRICS_TOKEN:
            auth_header = request.headers.get("authorization", "")
            token_header = request.headers.get("x-metrics-token", "")
            is_bearer = auth_header.lower().startswith("bearer ")
            bearer_token = auth_header[7:] if is_bearer else ""
            if config.METRICS_TOKEN not in {bearer_token, token_header}:
                return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
        return await call_next(request)

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=config.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Instrumentator().instrument(_app).expose(
        _app,
        include_in_schema=False,
        endpoint="/metrics",
    )

    return _app


app = get_application()


# health check
@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(api_router)
