from fastapi import APIRouter, Depends

from app.core.jwt import FastJWT
from api.private.profile import profile_router

private_router = APIRouter(prefix="/private", dependencies=[Depends(FastJWT().login_required)])

private_router.include_router(profile_router)