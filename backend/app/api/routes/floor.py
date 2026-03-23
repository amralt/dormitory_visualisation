from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.crud import get_by_number_floorordorm
from app.db.db import get_session

floor_router = APIRouter()


@floor_router.get("/dormirtory/{dormirtory_number}/floor/{floor_number}/students")
def get_students_by_floor(dormirtory_number: str, floor_number: str, session: Session = Depends(get_session)):
    if ("Общежитие " not in dormirtory_number):
        dormirtory_number = "Общежитие " + dormirtory_number
    
    
    students = get_by_number_floorordorm(dormirtory=dormirtory_number, floor=floor_number, session=session)

    if not students:
        raise HTTPException(status_code=404, detail="Студенты не найдены")

    return {
        "floor": floor_number,
        "students": [
            {
                "name": s.kontragent,
                "dormitory": s.dormitory,
                "room": s.room
            }
            for s in students
        ]
    }