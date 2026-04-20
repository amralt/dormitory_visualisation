from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.db import get_session
from app.db.crud import get_dormitory_stats
from app.api.schemas import DormitoryStats
from app.auth import get_current_user

router = APIRouter(prefix="/dormitory", tags=["dormitory"])


@router.get("/{dormitory_name}/stats", response_model=DormitoryStats)
def get_dormitory_statistics(dormitory_name: str, db: Session = Depends(get_session)):
    stats = get_dormitory_stats(db, dormitory_name)
    if stats["total_rooms"] == 0:
        raise HTTPException(status_code=404, detail="Общежитие не найдено")
    return stats
