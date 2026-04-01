from fastapi import Depends
from pydantic import BaseModel
from typing import Optional
from app.db.models import ResidentsBase
from sqlalchemy import select, or_, and_, cast, String
from sqlalchemy.orm import Session
from app.api.schemas import ResidentFilter
from typing import Optional
from app.db.db import get_session


def get_filtered_residents(session: Session, filters: ResidentFilter):
    query = select(ResidentsBase)

    if filters.resident_category:
        query = query.where(
            ResidentsBase.resident_category == filters.resident_category
        )

    if filters.floor is not None:
        query = query.where(ResidentsBase.floor == filters.floor)

    if filters.department:
        query = query.where(ResidentsBase.department == filters.department)

    if filters.residents_count is not None:
        query = query.where(ResidentsBase.residents_count == filters.residents_count)

    if filters.start_date:
        query = query.where(ResidentsBase.start_date >= filters.start_date)

    if filters.end_date:
        query = query.where(ResidentsBase.end_date <= filters.end_date)

    if filters.dormitory:
        query = query.where(ResidentsBase.dormitory.like(f"%{filters.dormitory}%"))

    return session.scalars(query).all()


def get_by_room_num(dormitory: str, room: str, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(
        or_(
            cast(ResidentsBase.room, String) == room,
            ResidentsBase.room.like(f"%{room}%"),
        ),
        ResidentsBase.dormitory == dormitory,
    )
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_namepart(
    s: str, dormitory: str = None, session: Session = None
) -> list[ResidentsBase]:
    if dormitory:
        stat = select(ResidentsBase).where(
            or_(
                ResidentsBase.kontragent.like(f"{s}%"),
                ResidentsBase.kontragent.like(f"% {s}%"),
            ),
            ResidentsBase.dormitory == dormitory,
        )
    else:
        stat = select(ResidentsBase).where(
            or_(
                ResidentsBase.kontragent.like(f"{s}%"),
                ResidentsBase.kontragent.like(f"% {s}%"),
            )
        )
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_id_dogovor(
    id: str, dormitory: str = None, session: Session = None
) -> list[ResidentsBase]:
    if dormitory:
        stat = select(ResidentsBase).where(
            ResidentsBase.registrator.contains(f"Направление на проживание {id}"),
            ResidentsBase.dormitory == dormitory,
        )
        db_obj = session.scalars(stat).all()
        return db_obj
    else:
        return (
            session.query(ResidentsBase)
            .filter(
                ResidentsBase.registrator.contains(f"Направление на проживание {id}")
            )
            .all()
        )


def get_by_dogovor_and_room(dormitory: str, qwery: str, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(
        or_(
            and_(
                cast(ResidentsBase.room, String) == qwery,
                ResidentsBase.dormitory == dormitory,
            ),
            ResidentsBase.registrator.contains(f"Направление на проживание {qwery}"),
        )
    )
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_number_floorordorm(num: str, dormitory: str, session: Session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(
        or_(
            cast(ResidentsBase.floor, String) == num,
            ResidentsBase.dormitory.like(f"%{num}%"),
        ),
        ResidentsBase.dormitory.like(dormitory),
    )
    db_obj = session.scalars(stat).all()

    return db_obj
