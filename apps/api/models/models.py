# app/models.py
from __future__ import annotations


from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import uuid4

from beanie import Document, Indexed, Link, PydanticObjectId
from pydantic import BaseModel, EmailStr, Field, validator


class User(Document):
    email: str
    password: str
    email_verified: bool = False
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Workspace(Document):
    name: str
    owner: Link[User]
    members: List[Link[User]] = [
        # owner will be added automatically
    ]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OTPActivationModel(Document):
    class Settings:
        name = "otp_activations"

    user_id: PydanticObjectId
    otp: str
    expires_at: datetime

class Address(BaseModel):
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    postcode: Optional[str] = None
    country: Optional[str] = None


from datetime import datetime
from pydantic import Field

class Person(Document):
    workspace_id: PydanticObjectId

    name: str
    email: Optional[EmailStr] = None
    billing_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    contact_person: Optional[str] = None

    address: Optional[Address] = None
    expense_tags: List[str] = Field(default_factory=list)
    tax_id: Optional[str] = None
    note: Optional[str] = None

    is_archived: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    class Settings:
        name = "persons"
        indexes = [
            "workspace_id",
            "email",
            "billing_email",
        ]


class IncomeSourceType(str, Enum):
    bank_transfer = "bank_transfer"
    payroll = "payroll"
    cash = "cash"
    manual = "manual"


class IncomeTransaction(Document):
    workspace_id: PydanticObjectId
    person_id: PydanticObjectId

    amount: float
    currency: str = "GBP"
    source_type: IncomeSourceType
    reference: Optional[str] = None

    received_at: datetime
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    is_reconciled: bool = False
    is_archived: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "income_transactions"
        indexes = [
            "workspace_id",
            "person_id",
            "received_at",
        ]
