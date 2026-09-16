from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.db import get_session
from app.db.crud import get_dormitory_stats
from app.api.schemas import DormitoryItem, DormitoryStats
from app.core.config import DORMITORIES

router = APIRouter(prefix="/dormitory", tags=["dormitory"])


@router.get("/{dormitory_name}/stats", response_model=DormitoryStats)
def get_dormitory_statistics(dormitory_name: str, db: Session = Depends(get_session)):
    stats = get_dormitory_stats(db, dormitory_name)
    return stats

from app.db.crud import get_dormitory_list  # добавьте в импорт в начале файла

@router.get("/", response_model=list[DormitoryItem])
def list_dormitories():
    """Возвращает список общежитий из конфигурации с флагом видимости."""
    return DORMITORIES