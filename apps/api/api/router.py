from re import A

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.routing import APIRoute

router = APIRouter(prefix="/api")
