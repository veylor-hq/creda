from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.jwt import FastJWT
from models.models import User


profile_router = APIRouter(prefix="/profile")


@profile_router.get("/")
async def profile_event(request: Request):
    token: dict = await FastJWT().decode(request.headers["Authorization"])
    user = await User.get(PydanticObjectId(token["id"]))
    if not user:
        raise HTTPException(401, "Unauthorized")
    
    return {
        "id": str(user.id),
        "email": user.email,
        "email_verified": user.email_verified,
    }
    