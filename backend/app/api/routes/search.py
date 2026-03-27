from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.crud import get_by_namepart, get_by_id, get_by_room_num
from app.db.db import get_session

# from app.core.scripts import get_search_type

search_router = APIRouter()

@search_router.get("/search/")
def get_search(qwery: str, session: Session = Depends(get_session)):
    ans = None
    if qwery.isdigit():
        if len(qwery) > 4:
            ans = get_by_id(int(qwery), session)
        ans = get_by_room_num(qwery, session)
    else:
        ans = get_by_namepart(qwery, session)

    return {"ans": ans}