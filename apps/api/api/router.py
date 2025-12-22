from re import A

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.routing import APIRoute

from api.auth import auth_router
from api.private import private_router
from api.public import public_router


router = APIRouter(prefix="/api")


router.include_router(auth_router)
router.include_router(private_router)
router.include_router(public_router)
