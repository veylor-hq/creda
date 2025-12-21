# app/models.py
from __future__ import annotations


from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import uuid4

from beanie import Document, Indexed, Link, PydanticObjectId
from pydantic import BaseModel, Field, validator


class User(Document):
    email: str
    password: str
    email_verified: bool = False
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