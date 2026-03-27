from app.db.models import ResidentsBase
from sqlalchemy import select, or_, and_, cast, String
from sqlalchemy.orm import Session


def get_by_room_num(dormitory: str, room: str, session) -> list[ResidentsBase]:
    print(f"____{room}____")
    stat = select(ResidentsBase).where(
        or_(
            cast(ResidentsBase.room, String) == room,
            ResidentsBase.room.like(f"%{room}%"),
        ),
        ResidentsBase.dormitory == dormitory,
    )
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_namepart(s: str, session) -> list[ResidentsBase]:
    stat = select(ResidentsBase).where(ResidentsBase.kontragent.contains(s))
    db_obj = session.scalars(stat).all()
    return db_obj


def get_by_id_dogovor(id: str, session: Session) -> list[ResidentsBase]:
    return session.query(ResidentsBase).filter(ResidentsBase.registrator.contains(f"Направление на проживание {id}")).all()


def get_by_dogovor_or_room(dormitory: str, qwery: str, session) -> list[ResidentsBase]:
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
