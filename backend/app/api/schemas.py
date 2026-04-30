from pydantic import BaseModel
from typing import Dict, List, Optional


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


class FloorResponse(ResidentResponse):
    krovatka: Optional[int] = None

class DormitoryStats(BaseModel):
    dormitory_name: str
    total_rooms: int
    occupied_rooms: int
    partially_occupied: int
    free_rooms: int
    departments_stats: Dict[str, int]
    total_students: int

class DormitoryItem(BaseModel):
    name: str
    visible: bool
    