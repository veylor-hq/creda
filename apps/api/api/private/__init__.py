from fastapi import APIRouter, Depends

from app.core.jwt import FastJWT
from api.private.profile import profile_router
from api.private.income import income_router
from api.private.identity import identity_router
from api.private.workspace import workspace_router

private_router = APIRouter(prefix="/private", dependencies=[Depends(FastJWT().login_required)])

private_router.include_router(profile_router)
private_router.include_router(income_router)
private_router.include_router(identity_router)
private_router.include_router(workspace_router)
