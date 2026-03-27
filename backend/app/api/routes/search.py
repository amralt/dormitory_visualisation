from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.crud import get_by_namepart, get_by_id_dogovor, get_by_room_num, get_by_dogovor_or_room
from app.db.db import get_session

from app.core.scripts import get_search_type
from app.core.config import SEARCH_BY_ID, SEARCH_BY_NAME, SEARCH_BY_ROOM, SEARCH_BY_ROOM_AND_ID

search_router = APIRouter()

@search_router.get("/search_students/")
def get_students(qwery: str, dormitory: str = None, session: Session = Depends(get_session)):
    search_type = get_search_type(qwery)
    ans = None

    if search_type == SEARCH_BY_ROOM_AND_ID:
        if not dormitory:
            ans = get_by_id_dogovor(qwery, session)
        else: 
            ans = get_by_dogovor_or_room(dormitory, qwery, session)

    if search_type == SEARCH_BY_ID:
        ans = get_by_id_dogovor(qwery, session)
    elif search_type == SEARCH_BY_ROOM:
        if not dormitory:
            return HTTPException(422, "параметр 'dormitory' обязателен, если происходит поиск по комнатам")
        ans = get_by_room_num(dormitory, qwery, session)
    elif search_type == SEARCH_BY_NAME:
        ans = get_by_namepart(qwery, session)

    return {"students-lsit": ans}