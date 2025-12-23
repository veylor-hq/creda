from beanie import PydanticObjectId
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.jwt import FastJWT
from models.models import NotificationSettings, User


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
        "notification_settings": (
            user.notification_settings.model_dump()
            if user.notification_settings
            else NotificationSettings().model_dump()
        ),
    }


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    notification_settings: NotificationSettings | None = None


@profile_router.patch("/")
async def update_profile(
    payload: ProfileUpdate,
    user=Depends(FastJWT().login_required),
):
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.notification_settings is not None:
        user.notification_settings = payload.notification_settings
    await user.save()
    return {
        "id": str(user.id),
        "email": user.email,
        "email_verified": user.email_verified,
        "full_name": user.full_name,
        "notification_settings": (
            user.notification_settings.model_dump()
            if user.notification_settings
            else NotificationSettings().model_dump()
        ),
    }
