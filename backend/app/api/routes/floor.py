from fastapi import APIRouter, HTTPException, Depends

from sqlalchemy.orm import Session
from app.db.crud import get_by_number_floorordorm
from app.db.db import get_session


floor_router = APIRouter()


@floor_router.get("/{floor_number}/students")
def get_students_by_floor(floor_number: int, session: Session = Depends(get_session)):
    students = get_by_number_floorordorm(num=str(floor_number), session=session)
    if not students:
        raise HTTPException(status_code=404, detail="Студенты не найдены")
    return {"floor": floor_number, "students": [s.name for s in students]} 
