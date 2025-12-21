from beanie import PydanticObjectId
from fastapi import APIRouter, Depends
from pydantic import BaseModel

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
        "full_name": user.full_name,
    }


class ProfileUpdate(BaseModel):
    full_name: str | None = None


@profile_router.patch("/")
async def update_profile(
    payload: ProfileUpdate,
    user=Depends(FastJWT().login_required),
):
    user.full_name = payload.full_name
    await user.save()
    return {
        "id": str(user.id),
        "email": user.email,
        "email_verified": user.email_verified,
        "full_name": user.full_name,
    }
