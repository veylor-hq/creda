
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Header, Path, APIRouter
from app.core.jwt import FastJWT
from models.models import User, Workspace

async def get_current_workspace(
    user: User = Depends(FastJWT().login_required),
    workspace_id: str | None = Header(None, alias="X-Workspace-ID"),
):
    if not workspace_id:
        workspace = await Workspace.find_one(
            Workspace.members.id == user.id
        )
    else:
        workspace = await Workspace.find_one(
            Workspace.id == PydanticObjectId(workspace_id),
            Workspace.members.id == user.id,
        )

    if not workspace:
        raise HTTPException(
            status_code=403,
            detail="Workspace not found or access denied",
        )

    return workspace
