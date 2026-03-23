from app.db.models import ResidentsBase, Rooms
from app.db.db import SessionLocal
from sqlalchemy import select, or_, cast, String


def get_by_room_num(room: int, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(ResidentsBase.room == room)
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_namepart(s: str, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(ResidentsBase.kontragent.contains(s))
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_number_floorordorm(num: int, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(
        or_(
            cast(ResidentsBase.floor, String) == str(num),
            ResidentsBase.dormitory.like(f"%{num}%"),
        )
    )
    db_obj = session.scalars(stat).all()
    return db_obj


def get_bed_by_resident(session):
    pass

with SessionLocal() as session:
    print(
        *get_by_number_floorordorm("5", session)
    ) 
