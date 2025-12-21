from fastapi import APIRouter, Depends

from app.core.jwt import FastJWT


private_router = APIRouter(prefix="/private", dependencies=[Depends(FastJWT().login_required)])