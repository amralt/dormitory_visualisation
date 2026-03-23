from app.db.models import ResidentsBase
from sqlalchemy import select, or_, cast, String


def get_by_room_num(room: int, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(ResidentsBase.room == room)
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_namepart(s: str, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(ResidentsBase.kontragent.contains(s))
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_number_floorordorm(num: str, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(
        or_(
            cast(ResidentsBase.floor, String) == num,
            ResidentsBase.dormitory.like(f"%{num}%"),
        )
    )
    db_obj = session.scalars(stat).all()
    return db_obj


# with Session() as session:
#     print(
#         *get_by_number_floorordorm("5", session)
#     )  # вывод сейчас выглядит очень плохо, но оно работает,
    # менять буду в зависимости от того, какую инфу нужно выводить дополнительно
