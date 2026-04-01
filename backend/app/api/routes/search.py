from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.crud import (
    get_by_namepart,
    get_by_id_dogovor,
    get_by_room_num,
    get_by_dogovor_and_room,
)
from app.db.db import get_session

from app.core.scripts import get_search_type
from app.core.config import (
    SEARCH_BY_ID,
    SEARCH_BY_NAME,
    SEARCH_BY_ROOM,
    SEARCH_BY_ROOM_AND_ID,
)
from app.api.schemas import ResidentResponse

search_router = APIRouter()


@search_router.get("/search_students/", response_model=list[ResidentResponse])
def get_students(
    qwery: str, dormitory: str = None, session: Session = Depends(get_session)
):
    search_type = get_search_type(qwery)
    ans = []
    if ord("а") <= ord(qwery[0]) <= ord("я"):
        qwery = chr(ord(qwery[0]) - ord("а") + ord("А")) + qwery[1::]

    if search_type == SEARCH_BY_ROOM_AND_ID:
        if not dormitory:
            ans = get_by_id_dogovor(qwery, dormitory=dormitory, session=session)
        else:
            ans = get_by_dogovor_and_room(dormitory, qwery, session)

    elif search_type == SEARCH_BY_ID:
        ans = get_by_id_dogovor(qwery, dormitory=dormitory, session=session)
    elif search_type == SEARCH_BY_ROOM:
        if not dormitory:
            raise HTTPException(
                422,
                "параметр 'dormitory' обязателен, если происходит поиск по комнатам",
            )
        ans = get_by_room_num(dormitory, qwery, session)
    elif search_type == SEARCH_BY_NAME:
        ans = get_by_namepart(qwery, dormitory=dormitory, session=session)

    return ans
