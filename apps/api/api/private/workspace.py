from datetime import datetime, timedelta
from uuid import uuid4

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from bson.dbref import DBRef
from pydantic import BaseModel, EmailStr

from app.core.config import config
from app.core.email import send_email
from app.core.jwt import FastJWT
from models.models import User, Workspace, WorkspaceInvite, WorkspaceReactivationToken

workspace_router = APIRouter(prefix="/workspace")

class WorkspaceCreate(BaseModel):
    name: str


class WorkspaceUpdate(BaseModel):
    name: str


class WorkspaceInviteCreate(BaseModel):
    email: EmailStr


def _owner_id(workspace: Workspace) -> str:
    owner = workspace.owner
    owner_id = _extract_member_id(owner)
    return owner_id or str(owner)


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


def _member_ids(workspace: Workspace) -> list[str]:
    ids: list[str] = []
    for member in workspace.members:
        member_id = _extract_member_id(member)
        if member_id:
            ids.append(member_id)
    return ids


def _member_object_ids(workspace: Workspace) -> list[PydanticObjectId]:
    ids: list[PydanticObjectId] = []
    for member_id in _member_ids(workspace):
        if PydanticObjectId.is_valid(member_id):
            ids.append(PydanticObjectId(member_id))
    return ids


def _user_in_workspace(workspace: Workspace, user_id: PydanticObjectId) -> bool:
    if str(user_id) == _owner_id(workspace):
        return True
    return str(user_id) in _member_ids(workspace)


def _build_invite_url(token: str) -> str:
    base_url = (config.FRONTEND_URL or config.API_BASE_URL).rstrip("/")
    return f"{base_url}/invite/{token}"


def _build_reactivation_url(token: str) -> str:
    base_url = (config.FRONTEND_URL or config.API_BASE_URL).rstrip("/")
    return f"{base_url}/workspace/reactivate/{token}"

async def _normalize_workspace_links(workspace: Workspace) -> None:
    member_ids = _member_ids(workspace)
    if member_ids:
        members = await User.find({"_id": {"$in": member_ids}}).to_list()
        members_by_id = {str(member.id): member for member in members}
        resolved_members = [
            members_by_id[member_id]
            for member_id in member_ids
            if member_id in members_by_id
        ]
        if resolved_members:
            workspace.members = resolved_members

    owner_id = _owner_id(workspace)
    if owner_id and not hasattr(workspace.owner, "id"):
        owner_user = await User.get(PydanticObjectId(owner_id))
        if owner_user:
            workspace.owner = owner_user


@workspace_router.get("/")
async def list_workspaces(
    request: Request,
    response: Response,
    user: User = Depends(FastJWT().login_required),
):
    all_workspaces = await Workspace.find(
        {"is_archived": {"$ne": True}}
    ).to_list()
    workspaces = [
        workspace
        for workspace in all_workspaces
        if _user_in_workspace(workspace, user.id)
    ]

    if workspaces and "X-Workspace-ID" not in request.cookies:
        response.set_cookie(
            key="X-Workspace-ID",
            value=str(workspaces[0].id),
            httponly=False,
            path="/",
        )

    return [
        {
            "id": str(workspace.id),
            "name": workspace.name,
            "owner_id": _owner_id(workspace),
        }
        for workspace in workspaces
    ]

@workspace_router.get("/get_workspace")
async def get_default_workspace(
    response: Response,
    user: User = Depends(FastJWT().login_required),
):
    all_workspaces = await Workspace.find(
        {"is_archived": {"$ne": True}}
    ).to_list()
    workspace = next(
        (item for item in all_workspaces if _user_in_workspace(item, user.id)),
        None,
    )

    if not workspace:
        raise HTTPException(
            status_code=404,
            detail="No workspace found for user",
        )

    # ✅ Set header + cookie
    response.headers["X-Workspace-ID"] = str(workspace.id)
    response.set_cookie(
        key="X-Workspace-ID",
        value=str(workspace.id),
        httponly=False,
        path="/",
    )

    return {
        "id": str(workspace.id),
        "name": workspace.name,
    }


@workspace_router.post("/")
async def create_workspace(
    payload: WorkspaceCreate,
    user: User = Depends(FastJWT().login_required),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Workspace name is required")

    workspace = Workspace(name=name, owner=user, members=[user])
    await workspace.insert()

    return {"id": str(workspace.id), "name": workspace.name, "owner_id": _owner_id(workspace)}


@workspace_router.get("/{workspace_id}")
async def get_workspace(
    workspace_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    member_ids = _member_object_ids(workspace)
    members = await User.find({"_id": {"$in": member_ids}}).to_list()

    return {
        "id": str(workspace.id),
        "name": workspace.name,
        "owner_id": _owner_id(workspace),
        "members": [
            {
                "id": str(member.id),
                "email": member.email,
                "full_name": member.full_name,
            }
            for member in members
        ],
    }


@workspace_router.post("/{workspace_id}/select")
async def select_workspace(
    workspace_id: PydanticObjectId,
    response: Response,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    response.set_cookie(
        key="X-Workspace-ID",
        value=str(workspace.id),
        httponly=False,
        path="/",
    )
    return {"ok": True, "workspace_id": str(workspace.id)}


@workspace_router.patch("/{workspace_id}")
async def update_workspace(
    workspace_id: PydanticObjectId,
    payload: WorkspaceUpdate,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if _owner_id(workspace) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can update the workspace")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Workspace name is required")

    workspace.name = name
    await _normalize_workspace_links(workspace)
    await workspace.save()

    return {"id": str(workspace.id), "name": workspace.name}


@workspace_router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if _owner_id(workspace) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can delete the workspace")

    workspace.is_archived = True
    token = str(uuid4())
    reset_entry = WorkspaceReactivationToken(
        workspace_id=workspace.id,
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    await reset_entry.insert()

    reactivation_url = _build_reactivation_url(token)
    await send_email(
        to=user.email,
        subject=f"Reactivate {workspace.name}",
        body=(
            f"Your workspace \"{workspace.name}\" has been deactivated.\n"
            f"Reactivate it here: {reactivation_url}\n"
        ),
    )
    await _normalize_workspace_links(workspace)
    await workspace.save()
    return {"ok": True}


@workspace_router.get("/{workspace_id}/invites")
async def list_workspace_invites(
    workspace_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if _owner_id(workspace) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can view invites")

    invites = await WorkspaceInvite.find(
        {"workspace_id": workspace.id, "accepted_at": None}
    ).to_list()
    return [
        {
            "id": str(invite.id),
            "email": invite.email,
            "created_at": invite.created_at,
        }
        for invite in invites
    ]


@workspace_router.post("/{workspace_id}/invite")
async def create_workspace_invite(
    workspace_id: PydanticObjectId,
    payload: WorkspaceInviteCreate,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if _owner_id(workspace) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can invite members")

    existing_member = await User.find_one({"email": payload.email})
    if existing_member and str(existing_member.id) in _member_ids(workspace):
        raise HTTPException(status_code=400, detail="User is already a member")

    existing_invite = await WorkspaceInvite.find_one(
        {"workspace_id": workspace.id, "email": payload.email, "accepted_at": None}
    )
    if existing_invite:
        raise HTTPException(status_code=409, detail="Invite already sent")

    token = str(uuid4())
    invite = WorkspaceInvite(
        workspace_id=workspace.id,
        email=payload.email,
        invited_by=user.id,
        token=token,
    )
    await invite.insert()

    invite_url = _build_invite_url(token)
    await send_email(
        to=payload.email,
        subject=f"Invitation to {workspace.name}",
        body=(
            f"You have been invited to join the workspace \"{workspace.name}\".\n"
            f"Accept the invite here: {invite_url}\n"
        ),
    )

    return {"id": str(invite.id), "email": invite.email}


@workspace_router.post("/invites/{token}/accept")
async def accept_workspace_invite(
    token: str,
    user: User = Depends(FastJWT().login_required),
):
    invite = await WorkspaceInvite.find_one({"token": token})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.accepted_at:
        raise HTTPException(status_code=400, detail="Invite already accepted")
    if invite.email.lower() != user.email.lower():
        raise HTTPException(status_code=403, detail="Invite email does not match your account")

    workspace = await Workspace.find_one(
        {"_id": invite.workspace_id, "is_archived": {"$ne": True}}
    )
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    member_ids = _member_ids(workspace)
    if str(user.id) not in member_ids:
        workspace.members.append(user)
        await _normalize_workspace_links(workspace)
        await workspace.save()

    invite.accepted_at = datetime.utcnow()
    invite.accepted_by = user.id
    await invite.save()

    return {"ok": True, "workspace_id": str(workspace.id)}


@workspace_router.delete("/{workspace_id}/invites/{invite_id}")
async def revoke_workspace_invite(
    workspace_id: PydanticObjectId,
    invite_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if _owner_id(workspace) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can revoke invites")

    invite = await WorkspaceInvite.find_one(
        {"_id": invite_id, "workspace_id": workspace.id}
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.accepted_at:
        raise HTTPException(status_code=400, detail="Invite already accepted")

    await invite.delete()
    return {"ok": True}


@workspace_router.delete("/{workspace_id}/members/{member_id}")
async def remove_workspace_member(
    workspace_id: PydanticObjectId,
    member_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if _owner_id(workspace) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can remove members")

    if _owner_id(workspace) == str(member_id):
        raise HTTPException(status_code=400, detail="You cannot remove the workspace owner")

    member_ids = _member_ids(workspace)
    if member_id not in member_ids:
        raise HTTPException(status_code=404, detail="Member not found")

    workspace.members = [
        member
        for member in workspace.members
        if _extract_member_id(member) != str(member_id)
    ]
    await _normalize_workspace_links(workspace)
    await workspace.save()
    return {"ok": True}


@workspace_router.delete("/{workspace_id}/leave")
async def leave_workspace(
    workspace_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
):
    workspace = await Workspace.find_one(
        {"_id": workspace_id, "is_archived": {"$ne": True}}
    )
    if workspace and not _user_in_workspace(workspace, user.id):
        workspace = None
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if _owner_id(workspace) == str(user.id):
        raise HTTPException(status_code=400, detail="Owner cannot leave their workspace")

    workspace.members = [
        member
        for member in workspace.members
        if _extract_member_id(member) != str(user.id)
    ]
    await _normalize_workspace_links(workspace)
    await workspace.save()
    return {"ok": True}


@workspace_router.post("/reactivate/{token}")
async def reactivate_workspace(
    token: str,
    user: User = Depends(FastJWT().login_required),
):
    token_entry = await WorkspaceReactivationToken.find_one({"token": token})
    if not token_entry:
        raise HTTPException(status_code=404, detail="Reactivation link is invalid")
    if token_entry.used_at:
        raise HTTPException(status_code=400, detail="Reactivation link is invalid")
    if token_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reactivation link is invalid")
    if str(token_entry.user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Reactivation link is invalid")

    workspace = await Workspace.find_one({"_id": token_entry.workspace_id})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    workspace.is_archived = False
    await _normalize_workspace_links(workspace)
    await workspace.save()

    token_entry.used_at = datetime.utcnow()
    await token_entry.save()

    return {"ok": True, "workspace_id": str(workspace.id)}
