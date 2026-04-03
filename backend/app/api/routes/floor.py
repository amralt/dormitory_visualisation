# backend/app/api/routes/floor.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.crud import get_by_number_floorordorm
from app.db.db import get_session
from app.api.schemas import ResidentResponse

floor_router = APIRouter()


@floor_router.get(
    "/floor/{floor_number}/students", response_model=list[ResidentResponse]
)
def get_students_by_floor(
    floor_number: str, dormitory: str, session: Session = Depends(get_session)
):
    students = get_by_number_floorordorm(
        num=floor_number, dormitory=dormitory, session=session
    )

    if not students:
        raise HTTPException(status_code=404, detail="Студенты не найдены")
    return students
