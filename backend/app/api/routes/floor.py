from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.crud import get_by_number_floorordorm
from app.db.db import get_session
from app.auth import get_current_user

floor_router = APIRouter()


@floor_router.get("/floor/{floor_number}/students")
def get_students_by_floor(
    floor_number: str, 
    dormitory: str, 
    session: Session = Depends(get_session), 
    user: dict = Depends(get_current_user) 
):
    # Передаем юзера в CRUD, чтобы там отработала логика маскирования
    students = get_by_number_floorordorm(
        num=floor_number, dormitory=dormitory, session=session, user=user
    )

    if not students:
        raise HTTPException(status_code=404, detail="Студенты не найдены")
    return students