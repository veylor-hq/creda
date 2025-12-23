
from beanie import PydanticObjectId
from bson.dbref import DBRef
from fastapi import Depends, HTTPException, Header, Path, APIRouter, Cookie
from app.core.jwt import FastJWT
from models.models import User, Workspace


def _extract_member_id(member: object) -> str | None:
    if hasattr(member, "id"):
        return str(member.id)
    if hasattr(member, "pk"):
        return str(member.pk)
    if hasattr(member, "ref") and isinstance(member.ref, DBRef):
        return str(member.ref.id)
    if hasattr(member, "to_ref"):
        try:
            ref = member.to_ref()
            if isinstance(ref, DBRef):
                return str(ref.id)
        except Exception:
            pass
    if isinstance(member, DBRef):
        return str(member.id)
    if isinstance(member, dict):
        ref_id = member.get("$id")
        if ref_id:
            return str(ref_id)
        raw_id = member.get("_id")
        if raw_id and PydanticObjectId.is_valid(str(raw_id)):
            return str(raw_id)
        member_id = member.get("id")
        if member_id and PydanticObjectId.is_valid(str(member_id)):
            return str(member_id)
    if isinstance(member, str) and PydanticObjectId.is_valid(member):
        return member
    if isinstance(member, PydanticObjectId):
        return str(member)
    return None


def _owner_id(workspace: Workspace) -> str | None:
    return _extract_member_id(workspace.owner)


def _member_ids(workspace: Workspace) -> set[str]:
    ids: set[str] = set()
    for member in workspace.members:
        member_id = _extract_member_id(member)
        if member_id:
            ids.add(member_id)
    return ids

async def get_current_workspace(
    user: User = Depends(FastJWT().login_required),
    workspace_id: str | None = Header(None, alias="X-Workspace-ID"),
    workspace_cookie: str | None = Cookie(None, alias="X-Workspace-ID"),
):
    workspace_lookup = workspace_id or workspace_cookie
    if workspace_lookup:
        workspace = await Workspace.find_one(
            {"_id": PydanticObjectId(workspace_lookup), "is_archived": {"$ne": True}}
        )
        if workspace:
            owner_id = _owner_id(workspace)
            if str(user.id) in _member_ids(workspace) or owner_id == str(user.id):
                return workspace

    workspace = None
    for item in await Workspace.find({"is_archived": {"$ne": True}}).to_list():
        owner_id = _owner_id(item)
        if str(user.id) in _member_ids(item) or owner_id == str(user.id):
            workspace = item
            break

    if not workspace:
        raise HTTPException(
            status_code=403,
            detail="Workspace not found or access denied",
        )

    return workspace
