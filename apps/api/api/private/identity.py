from datetime import datetime
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException, Header, Path, APIRouter, Query

from app.core.jwt import FastJWT
from utils.get_current_workspace import get_current_workspace
from models.models import Address, Person, User, Workspace


identity_router = APIRouter(prefix="/identity")


from pydantic import BaseModel, EmailStr
from typing import Optional, List


class PersonCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    billing_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None
    address: Optional[Address] = None
    expense_tags: List[str] = []
    tax_id: Optional[str] = None
    note: Optional[str] = None


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    billing_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None
    address: Optional[Address] = None
    expense_tags: Optional[List[str]] = None
    tax_id: Optional[str] = None
    note: Optional[str] = None



class PersonListItem(BaseModel):
    id: PydanticObjectId
    name: str
    email: Optional[EmailStr] = None
    contact_person: Optional[str] = None
    is_archived: bool

class PersonExpanded(PersonListItem):
    billing_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[Address] = None
    expense_tags: List[str] = []
    tax_id: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

@identity_router.post("/")
async def create_person(
    payload: PersonCreate,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    person = Person(
        workspace_id=workspace.id,
        **payload.model_dump(),
    )
    await person.insert()
    return person


@identity_router.get("/")
async def list_persons(
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),

    # 🔍 filters
    search: Optional[str] = Query(None, description="Search by name or email"),
    tag: Optional[str] = Query(None, description="Filter by expense tag"),
    archived: Optional[str] = Query("false"),

    # 🧩 includes
    include: List[str] = Query(
        default=[],
        description="Extra fields to include (e.g. include=details)"
    ),
):
    query = Person.find(Person.workspace_id == workspace.id)

    archived_value = archived.lower() if archived else None
    if archived_value in ("true", "false"):
        query = query.find(Person.is_archived == (archived_value == "true"))
    elif archived_value not in (None, "all"):
        raise HTTPException(status_code=400, detail="Invalid archived value")

    if search:
        query = query.find(
            {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                ]
            }
        )

    if tag:
        query = query.find(Person.expense_tags == tag)

    persons = await query.to_list()

    # 🔒 default response
    if "details" not in include:
        return [
            PersonListItem(
                id=p.id,
                name=p.name,
                email=p.email,
                contact_person=p.contact_person,
                is_archived=p.is_archived,
            )
            for p in persons
        ]

    # 🧠 expanded response
    return [
            PersonExpanded(
                id=p.id,
                name=p.name,
                email=p.email,
                contact_person=p.contact_person,
                billing_email=p.billing_email,
                phone=p.phone,
                website=p.website,
                address=p.address,
                expense_tags=p.expense_tags,
                tax_id=p.tax_id,
                note=p.note,
                created_at=p.created_at,
                is_archived=p.is_archived,
            )
        for p in persons
    ]

@identity_router.get("/{person_id}")
async def get_person(
    person_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    person = await Person.find_one(
        Person.id == person_id,
        Person.workspace_id == workspace.id,
        Person.is_archived == False,
    )

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    return person

@identity_router.patch("/{person_id}")
async def update_person(
    person_id: PydanticObjectId,
    payload: PersonUpdate,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    person = await Person.find_one(
        Person.id == person_id,
        Person.workspace_id == workspace.id,
        Person.is_archived == False,
    )

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(person, field, value)

    person.updated_at = datetime.utcnow()
    await person.save()

    return person

@identity_router.delete("/{person_id}")
async def archive_person(
    person_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    person = await Person.find_one(
        Person.id == person_id,
        Person.workspace_id == workspace.id,
        Person.is_archived == False,
    )

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    person.is_archived = True
    person.updated_at = datetime.utcnow()
    await person.save()

    return {"ok": True}


@identity_router.patch("/{person_id}/reactivate")
async def reactivate_person(
    person_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    person = await Person.find_one(
        Person.id == person_id,
        Person.workspace_id == workspace.id,
    )

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    person.is_archived = False
    person.updated_at = datetime.utcnow()
    await person.save()

    return person
