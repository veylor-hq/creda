from fastapi import APIRouter

from api.public.invoice import public_invoice_router

public_router = APIRouter(prefix="/public")

public_router.include_router(public_invoice_router)
