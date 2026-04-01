from pydantic import BaseModel
from typing import Optional

class ResidentFilter(BaseModel):
    resident_category: Optional[str] = None
    floor: Optional[int] = None
    department: Optional[str] = None
    residents_count: Optional[int] = None
    dormitory: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ResidentResponse(BaseModel):
    fiz_lico: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    room: Optional[str] = None
    floor: Optional[int] = None
    dormitory: Optional[str] = None
    organisation: Optional[str] = None
    resident_category: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True
