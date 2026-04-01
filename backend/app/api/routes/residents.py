# app/api/routes/residents.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.db import get_session
from app.db.crud import get_filtered_residents
from app.api.schemas import ResidentFilter, ResidentResponse

router = APIRouter(prefix="/residents", tags=["residents"])


@router.get("/", response_model=list[ResidentResponse])
def get_residents(
    filters: ResidentFilter = Depends(), db: Session = Depends(get_session)
):
    residents = get_filtered_residents(db, filters)
    return residents
