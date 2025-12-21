from re import A

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.routing import APIRoute

from api.auth import auth_router

router = APIRouter(prefix="/api")

router.include_router(auth_router)