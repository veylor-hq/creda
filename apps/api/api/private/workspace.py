from fastapi import APIRouter, Depends, HTTPException, Response

from app.core.jwt import FastJWT
from models.models import User, Workspace

workspace_router = APIRouter(prefix="/workspace")


@workspace_router.get("/get_workspace")
async def get_default_workspace(
    response: Response,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        Workspace.members.id == user.id
    )

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="No workspace found for user",
        )

    # ✅ Set header
    response.headers["X-Workspace-ID"] = str(workspace.id)

    return {
        "id": str(workspace.id),
        "name": workspace.name,
    }