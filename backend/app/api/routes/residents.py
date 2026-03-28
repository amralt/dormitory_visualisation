# app/api/routes/residents.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.db import get_db
from app.db.crud import get_filtered_residents
from app.schemas import ResidentFilter

router = APIRouter(prefix="/residents", tags=["residents"])


@router.get("/")
def get_residents(filters: ResidentFilter = Depends(), db: Session = Depends(get_db)):
    residents = get_filtered_residents(db, filters)
    return residents
