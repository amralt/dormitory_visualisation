from fastapi import Depends
from pydantic import BaseModel
from typing import Optional
from app.db.models import ResidentsBase
from sqlalchemy import select, or_, and_, cast, String
from sqlalchemy.orm import Session

from app.db.db import get_session


class ResidentFilter(BaseModel):
    resident_category: Optional[str] = None
    floor: Optional[int] = None
    department: Optional[str] = None
    residents_count: Optional[int] = None
    dormitory: Optional[str] = None
    end_date_from: Optional[str] = None
    end_date_to: Optional[str] = None
