from datetime import datetime, timedelta, timezone
from typing import List, Optional, Literal

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.jwt import FastJWT
from models.models import IncomeSourceType, IncomeStatus, IncomeTransaction, Person, User, Workspace, Invoice
from utils.get_current_workspace import get_current_workspace


income_router = APIRouter(prefix="/income")


class IncomeCreate(BaseModel):
    person_id: PydanticObjectId
    amount: float
    currency: str = "GBP"
    source_type: IncomeSourceType
    reference: Optional[str] = None
    status: IncomeStatus = IncomeStatus.received
    received_at: datetime
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_reconciled: bool = False
    invoice_id: Optional[PydanticObjectId] = None


class IncomeUpdate(BaseModel):
    reference: Optional[str] = None
    received_at: Optional[datetime] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    is_reconciled: Optional[bool] = None
    status: Optional[IncomeStatus] = None


class IncomeListItem(BaseModel):
    id: PydanticObjectId
    person_id: PydanticObjectId
    invoice_id: Optional[PydanticObjectId] = None
    amount: float
    currency: str
    source_type: IncomeSourceType
    reference: Optional[str] = None
    status: IncomeStatus
    received_at: datetime
    is_reconciled: bool


def _validate_received_at(received_at: datetime, status: IncomeStatus) -> None:
    if status == IncomeStatus.planned:
        return
    if received_at.tzinfo is None:
        latest_allowed = datetime.utcnow() + timedelta(days=1)
    else:
        latest_allowed = datetime.now(timezone.utc) + timedelta(days=1)
    if received_at > latest_allowed:
        raise HTTPException(
            status_code=400,
            detail="received_at cannot be in the future",
        )

def _apply_status_filter(query, status: str):
    if status == "all":
        return query
    if status == "planned":
        return query.find(IncomeTransaction.status == IncomeStatus.planned)
    return query.find(
        {
            "$or": [
                {"status": IncomeStatus.received},
                {"status": {"$exists": False}},
                {"status": None},
            ]
        }
    )


@income_router.post("/")
async def create_income(
    payload: IncomeCreate,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than 0")

    _validate_received_at(payload.received_at, payload.status)

    person = await Person.find_one(
        Person.id == payload.person_id,
        Person.workspace_id == workspace.id,
        Person.is_archived == False,
    )

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    if payload.invoice_id:
        invoice = await Invoice.find_one(
            {"_id": payload.invoice_id, "workspace_id": workspace.id, "is_archived": False}
        )
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        if invoice.person_id != payload.person_id:
            raise HTTPException(
                status_code=400,
                detail="Invoice does not belong to the selected customer",
            )

    income = IncomeTransaction(
        workspace_id=workspace.id,
        **payload.model_dump(),
    )
    await income.insert()
    return income


@income_router.get("/")
async def list_income(
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
    person_id: Optional[PydanticObjectId] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    source_type: Optional[IncomeSourceType] = Query(None),
    is_reconciled: Optional[bool] = Query(None),
    status: Literal["received", "planned", "all"] = Query("all"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    sort_by: Literal["received_at", "amount", "created_at"] = Query("received_at"),
    sort_dir: Literal["asc", "desc"] = Query("desc"),
):
    query = IncomeTransaction.find(
        IncomeTransaction.workspace_id == workspace.id,
        IncomeTransaction.is_archived == False,
    )

    if person_id:
        query = query.find(IncomeTransaction.person_id == person_id)

    if from_date:
        query = query.find(IncomeTransaction.received_at >= from_date)

    if to_date:
        query = query.find(IncomeTransaction.received_at <= to_date)

    if min_amount is not None:
        query = query.find(IncomeTransaction.amount >= min_amount)

    if max_amount is not None:
        query = query.find(IncomeTransaction.amount <= max_amount)

    if source_type:
        query = query.find(IncomeTransaction.source_type == source_type)

    if is_reconciled is not None:
        query = query.find(IncomeTransaction.is_reconciled == is_reconciled)

    query = _apply_status_filter(query, status)

    sort_field = {
        "received_at": "received_at",
        "amount": "amount",
        "created_at": "created_at",
    }[sort_by]
    sort_direction = "" if sort_dir == "asc" else "-"

    total = await query.count()
    incomes = (
        await query.sort(f"{sort_direction}{sort_field}")
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list()
    )

    return {
        "items": [
            IncomeListItem(
                id=income.id,
                person_id=income.person_id,
                invoice_id=income.invoice_id,
                amount=income.amount,
                currency=income.currency,
                source_type=income.source_type,
                reference=income.reference,
                status=income.status or IncomeStatus.received,
                received_at=income.received_at,
                is_reconciled=income.is_reconciled,
            )
            for income in incomes
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }


@income_router.get("/summary")
async def income_summary(
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
    person_id: Optional[PydanticObjectId] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    source_type: Optional[IncomeSourceType] = Query(None),
    is_reconciled: Optional[bool] = Query(None),
    status: Literal["received", "planned", "all"] = Query("received"),
):
    query = IncomeTransaction.find(
        IncomeTransaction.workspace_id == workspace.id,
        IncomeTransaction.is_archived == False,
    )

    if person_id:
        query = query.find(IncomeTransaction.person_id == person_id)

    if from_date:
        query = query.find(IncomeTransaction.received_at >= from_date)

    if to_date:
        query = query.find(IncomeTransaction.received_at <= to_date)

    if source_type:
        query = query.find(IncomeTransaction.source_type == source_type)

    if is_reconciled is not None:
        query = query.find(IncomeTransaction.is_reconciled == is_reconciled)

    query = _apply_status_filter(query, status)

    incomes = await query.to_list()
    total_amount = sum(income.amount for income in incomes)
    reconciled_count = sum(1 for income in incomes if income.is_reconciled)

    return {
        "count": len(incomes),
        "total_amount": total_amount,
        "reconciled_count": reconciled_count,
    }


@income_router.get("/{income_id}")
async def get_income(
    income_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    income = await IncomeTransaction.find_one(
        IncomeTransaction.id == income_id,
        IncomeTransaction.workspace_id == workspace.id,
        IncomeTransaction.is_archived == False,
    )

    if not income:
        raise HTTPException(status_code=404, detail="Income not found")

    return income


@income_router.patch("/{income_id}")
async def update_income(
    income_id: PydanticObjectId,
    payload: IncomeUpdate,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    income = await IncomeTransaction.find_one(
        IncomeTransaction.id == income_id,
        IncomeTransaction.workspace_id == workspace.id,
        IncomeTransaction.is_archived == False,
    )

    if not income:
        raise HTTPException(status_code=404, detail="Income not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "received_at" in update_data and update_data["received_at"]:
        status_value = update_data.get("status") or income.status
        _validate_received_at(update_data["received_at"], status_value)

    for field, value in update_data.items():
        setattr(income, field, value)

    if "status" in update_data and update_data["status"] == IncomeStatus.received:
        _validate_received_at(income.received_at, income.status)

    income.updated_at = datetime.utcnow()
    await income.save()

    return income


@income_router.delete("/{income_id}")
async def archive_income(
    income_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    income = await IncomeTransaction.find_one(
        IncomeTransaction.id == income_id,
        IncomeTransaction.workspace_id == workspace.id,
        IncomeTransaction.is_archived == False,
    )

    if not income:
        raise HTTPException(status_code=404, detail="Income not found")

    income.is_archived = True
    income.updated_at = datetime.utcnow()
    await income.save()

    return {"ok": True}
