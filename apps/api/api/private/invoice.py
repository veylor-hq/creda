from datetime import datetime
from typing import List, Optional, Literal
from uuid import uuid4

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.jwt import FastJWT
from app.core.email import send_email
from app.core.config import config
from models.models import (
    IncomeSourceType,
    IncomeTransaction,
    Invoice,
    InvoiceLineItem,
    InvoiceStatus,
    Person,
    User,
    Workspace,
)
from utils.get_current_workspace import get_current_workspace


invoice_router = APIRouter(prefix="/invoice")


class InvoiceItemPayload(BaseModel):
    description: str
    quantity: float
    unit_price: float


class InvoiceCreate(BaseModel):
    person_id: PydanticObjectId
    currency: str = "GBP"
    issue_date: datetime
    due_date: datetime
    items: List[InvoiceItemPayload] = Field(default_factory=list)
    notes: Optional[str] = None
    payment_details: Optional[str] = None
    tax_rate: float = 0.0
    status: InvoiceStatus = InvoiceStatus.draft
    is_public: bool = False
    send_email: bool = False


class InvoiceUpdate(BaseModel):
    person_id: Optional[PydanticObjectId] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    items: Optional[List[InvoiceItemPayload]] = None
    notes: Optional[str] = None
    payment_details: Optional[str] = None
    tax_rate: Optional[float] = None
    status: Optional[InvoiceStatus] = None
    is_public: Optional[bool] = None


class InvoiceListItem(BaseModel):
    id: str
    person_id: str
    number: str
    status: InvoiceStatus
    total: float
    currency: str
    issue_date: datetime
    due_date: datetime
    is_public: bool


def _compute_totals(items: List[InvoiceItemPayload], tax_rate: float):
    line_items: List[InvoiceLineItem] = []
    subtotal = 0.0
    for item in items:
        if isinstance(item, dict):
            item = InvoiceItemPayload(**item)
        line_total = item.quantity * item.unit_price
        subtotal += line_total
        line_items.append(
            InvoiceLineItem(
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total=line_total,
            )
        )
    tax_amount = subtotal * (tax_rate / 100)
    total = subtotal + tax_amount
    return line_items, subtotal, tax_amount, total


def _as_payload_list(items: List[InvoiceLineItem]) -> List[InvoiceItemPayload]:
    return [
        InvoiceItemPayload(
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        for item in items
    ]


async def _next_invoice_number(workspace_id: PydanticObjectId) -> str:
    count = await Invoice.find({"workspace_id": workspace_id}).count()
    return f"INV-{count + 1:04d}"


def _validate_dates(issue_date: datetime, due_date: datetime):
    if due_date < issue_date:
        raise HTTPException(status_code=400, detail="due_date must be after issue_date")


def _build_public_invoice_url(public_id: str) -> str:
    if config.FRONTEND_URL:
        return f"{config.FRONTEND_URL.rstrip('/')}/invoice/{public_id}"
    return f"{config.API_BASE_URL.rstrip('/')}/api/public/invoice/{public_id}"


@invoice_router.post("/")
async def create_invoice(
    payload: InvoiceCreate,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    person = await Person.find_one(
        Person.id == payload.person_id,
        Person.workspace_id == workspace.id,
        Person.is_archived == False,
    )

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    _validate_dates(payload.issue_date, payload.due_date)

    items, subtotal, tax_amount, total = _compute_totals(
        payload.items, payload.tax_rate
    )
    number = await _next_invoice_number(workspace.id)

    invoice = Invoice(
        workspace_id=workspace.id,
        person_id=payload.person_id,
        number=number,
        public_id=str(uuid4()),
        status=payload.status,
        currency=payload.currency,
        issue_date=payload.issue_date,
        due_date=payload.due_date,
        items=items,
        notes=payload.notes,
        payment_details=payload.payment_details,
        tax_rate=payload.tax_rate,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=total,
        is_public=payload.is_public,
    )
    await invoice.insert()

    if payload.send_email:
        if not person.email:
            raise HTTPException(status_code=400, detail="Customer has no email")
        if not invoice.is_public:
            raise HTTPException(
                status_code=400,
                detail="Invoice must be public to include a link.",
            )
        invoice_url = _build_public_invoice_url(invoice.public_id)
        await send_email(
            to=person.email,
            subject=f"Invoice {invoice.number}",
            body=(
                f"Invoice {invoice.number} issued for {invoice.total:.2f} {invoice.currency}."
                f"\nView invoice: {invoice_url}"
            ),
        )

    return invoice


@invoice_router.get("/")
async def list_invoices(
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
    person_id: Optional[PydanticObjectId] = Query(None),
    status: Optional[InvoiceStatus] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    sort_by: Literal["issue_date", "due_date", "total", "created_at"] = Query("issue_date"),
    sort_dir: Literal["asc", "desc"] = Query("desc"),
):
    query = Invoice.find({"workspace_id": workspace.id, "is_archived": False})

    if person_id:
        query = query.find({"person_id": person_id})

    if status:
        query = query.find({"status": status})

    if from_date:
        query = query.find({"issue_date": {"$gte": from_date}})

    if to_date:
        query = query.find({"issue_date": {"$lte": to_date}})

    sort_field = {
        "issue_date": "issue_date",
        "due_date": "due_date",
        "total": "total",
        "created_at": "created_at",
    }[sort_by]
    sort_direction = "" if sort_dir == "asc" else "-"

    total = await query.count()
    invoices = (
        await query.sort(f"{sort_direction}{sort_field}")
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list()
    )

    return {
        "items": [
            InvoiceListItem(
                id=str(invoice.id),
                person_id=str(invoice.person_id),
                number=invoice.number,
                status=invoice.status,
                total=invoice.total,
                currency=invoice.currency,
                issue_date=invoice.issue_date,
                due_date=invoice.due_date,
                is_public=invoice.is_public,
            )
            for invoice in invoices
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }


@invoice_router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    invoice = await Invoice.find_one(
        {"_id": invoice_id, "workspace_id": workspace.id, "is_archived": False}
    )

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice


@invoice_router.patch("/{invoice_id}")
async def update_invoice(
    invoice_id: PydanticObjectId,
    payload: InvoiceUpdate,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    invoice = await Invoice.find_one(
        {"_id": invoice_id, "workspace_id": workspace.id, "is_archived": False}
    )

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    update_data = payload.model_dump(exclude_unset=True)
    previous_status = invoice.status

    if "person_id" in update_data:
        person = await Person.find_one(
            Person.id == update_data["person_id"],
            Person.workspace_id == workspace.id,
            Person.is_archived == False,
        )
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")

    issue_date = update_data.get("issue_date", invoice.issue_date)
    due_date = update_data.get("due_date", invoice.due_date)
    _validate_dates(issue_date, due_date)

    if "items" in update_data or "tax_rate" in update_data:
        items_payload = update_data.get("items", _as_payload_list(invoice.items))
        tax_rate = update_data.get("tax_rate", invoice.tax_rate)
        items, subtotal, tax_amount, total = _compute_totals(items_payload, tax_rate)
        invoice.items = items
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total = total
        invoice.tax_rate = tax_rate

    for field, value in update_data.items():
        if field in {"items", "tax_rate"}:
            continue
        setattr(invoice, field, value)

    invoice.updated_at = datetime.utcnow()
    await invoice.save()

    if update_data.get("status") == InvoiceStatus.paid and previous_status != InvoiceStatus.paid:
        existing_income = await IncomeTransaction.find_one(
            {
                "workspace_id": workspace.id,
                "invoice_id": invoice.id,
                "is_archived": False,
            }
        )
        if not existing_income:
            income = IncomeTransaction(
                workspace_id=workspace.id,
                person_id=invoice.person_id,
                invoice_id=invoice.id,
                amount=invoice.total,
                currency=invoice.currency,
                source_type=IncomeSourceType.bank_transfer,
                reference=invoice.number,
                received_at=datetime.utcnow(),
                notes=f"Auto-generated from invoice {invoice.number}.",
            )
            await income.insert()

    return invoice


@invoice_router.delete("/{invoice_id}")
async def archive_invoice(
    invoice_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    invoice = await Invoice.find_one(
        {"_id": invoice_id, "workspace_id": workspace.id, "is_archived": False}
    )

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.is_archived = True
    invoice.updated_at = datetime.utcnow()
    await invoice.save()

    return {"ok": True}


@invoice_router.post("/{invoice_id}/send")
async def send_invoice_email(
    invoice_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    invoice = await Invoice.find_one(
        {"_id": invoice_id, "workspace_id": workspace.id, "is_archived": False}
    )

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    person = await Person.find_one(
        Person.id == invoice.person_id,
        Person.workspace_id == workspace.id,
    )

    if not person or not person.email:
        raise HTTPException(status_code=400, detail="Customer has no email")
    if not invoice.is_public:
        raise HTTPException(
            status_code=400,
            detail="Invoice must be public to include a link.",
        )
    invoice_url = _build_public_invoice_url(invoice.public_id)

    await send_email(
        to=person.email,
        subject=f"Invoice {invoice.number}",
        body=(
            f"Invoice {invoice.number} issued for {invoice.total:.2f} {invoice.currency}."
            f"\nView invoice: {invoice_url}"
        ),
    )

    return {"ok": True}


@invoice_router.post("/{invoice_id}/send-reminder")
async def send_invoice_reminder(
    invoice_id: PydanticObjectId,
    user: User = Depends(FastJWT().login_required),
    workspace: Workspace = Depends(get_current_workspace),
):
    invoice = await Invoice.find_one(
        {"_id": invoice_id, "workspace_id": workspace.id, "is_archived": False}
    )

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    person = await Person.find_one(
        Person.id == invoice.person_id,
        Person.workspace_id == workspace.id,
    )

    if not person or not person.email:
        raise HTTPException(status_code=400, detail="Customer has no email")
    if not invoice.is_public:
        raise HTTPException(
            status_code=400,
            detail="Invoice must be public to include a link.",
        )
    invoice_url = _build_public_invoice_url(invoice.public_id)

    await send_email(
        to=person.email,
        subject=f"Reminder: Invoice {invoice.number}",
        body=(
            f"Reminder for invoice {invoice.number} totaling {invoice.total:.2f} {invoice.currency}."
            f"\nView invoice: {invoice_url}"
        ),
    )

    return {"ok": True}
