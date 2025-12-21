from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.jwt import FastJWT
from models.models import User


profile_router = APIRouter(prefix="/profile")

@profile_router.get("/")
async def profile_event(
    user=Depends(FastJWT().login_required),
):
    return {
        "id": str(user.id),
        "email": user.email,
        "email_verified": user.email_verified,
    }
