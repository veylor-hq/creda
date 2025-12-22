from fastapi import APIRouter, HTTPException

from models.models import Invoice

public_invoice_router = APIRouter(prefix="/invoice")


@public_invoice_router.get("/{public_id}")
async def get_public_invoice(public_id: str):
    invoice = await Invoice.find_one(
        Invoice.public_id == public_id,
        Invoice.is_public == True,
        Invoice.is_archived == False,
    )

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice
