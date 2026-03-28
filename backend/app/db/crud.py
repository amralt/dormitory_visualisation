from fastapi import Depends
from pydantic import BaseModel
from typing import Optional
from app.db.models import ResidentsBase
from sqlalchemy import select, or_, and_, cast, String
from sqlalchemy.orm import Session

from app.db.db import get_session


##мб лучше создать файл отдельный для этой модельки, но это так..
class ResidentFilter(BaseModel):
    period: Optional[str] = None
    resident_category: Optional[str] = None
    floor: Optional[int] = None
    department: Optional[str] = None
    residents_count: Optional[int] = None
    dormitory: Optional[str] = None
    end_date_from: Optional[str] = None
    end_date_to: Optional[str] = None


def get_filtered_residents(db: Session, filters: ResidentFilter):
    query = select(ResidentsBase)
    if filters.period:
        query = query.where(ResidentsBase.period == filters.period)

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

    if filters.end_date_from:
        query = query.where(ResidentsBase.end_date >= filters.end_date_from)

    if filters.end_date_to:
        query = query.where(ResidentsBase.end_date <= filters.end_date_to)

    if filters.dormitory:
        query = query.where(ResidentsBase.dormitory.like(f"%{filters.dormitory}%"))

    return db.scalars(query).all()


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


def get_by_number_floorordorm(
    num: str,
    session: Session,
    period: str = None,
    resident_category: str = None,
    floor: int = None,
    department: str = None,
    residents_count: int = None,
    end_date_from: str = None,
    end_date_to: str = None,
) -> list[ResidentsBase]:
    filters = ResidentFilter(
        period=period,
        resident_category=resident_category,
        floor=floor,
        department=department,
        residents_count=residents_count,
        end_date_from=end_date_from,
        end_date_to=end_date_to,
    )

    filters.floor = int(num)
    filters.dormitory = num
    return get_filtered_residents(session, filters)


# with Session() as session:
#     print(
#         *get_by_number_floorordorm("5", session)
#     )  # вывод сейчас выглядит очень плохо, но оно работает,
# менять буду в зависимости от того, какую инфу нужно выводить дополнительно
