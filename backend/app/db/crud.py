from app.db.models import ResidentsBase
from sqlalchemy import select, or_, cast, String, and_


def get_by_room_num(room: int, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(ResidentsBase.room == room)
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_namepart(s: str, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(ResidentsBase.kontragent.contains(s))
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_number_floorordorm(dormirtory: str, floor: str, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(
        or_(
            cast(ResidentsBase.floor, String) == floor,
            ResidentsBase.dormitory.like(f"%{floor}%"),
        ),
        cast(ResidentsBase.dormitory, String) == dormirtory,
    )
    db_obj = session.scalars(stat).all()
    return db_obj
