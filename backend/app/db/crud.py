from app.db.models import ResidentsBase, Rooms
from sqlalchemy import select, or_, and_, cast, String, func
from sqlalchemy.orm import Session
from app.api.schemas import ResidentFilter, FloorResponse


def filter(session: Session, filters: ResidentFilter):
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


def get_dormitory_stats(session: Session, dormitory_name: str) -> dict:
    total_rooms = 128  # заглушка для общежития 2
    residents_count_query = (
        select(
            ResidentsBase.room,
            func.count(ResidentsBase.linenumber).label("residents_count"),
        )
        .where(
            ResidentsBase.dormitory == dormitory_name,
            ResidentsBase.room != "",
            ResidentsBase.room.isnot(None),
        )
        .group_by(ResidentsBase.room)
    )

    room_count = session.execute(residents_count_query).all()
    occupied = 0
    partially = 0
    free = 0
    room_residents = {}
    for room, count in room_count:
        room_residents[room] = count
        if count == 2:
            occupied += 1
        elif count == 1:
            partially += 1
    free = total_rooms - (occupied + partially)

    dept_query = (
        select(
            ResidentsBase.department,
            func.count(ResidentsBase.linenumber).label("count"),
        )
        .where(ResidentsBase.dormitory == dormitory_name)
        .group_by(ResidentsBase.department)
    )

    dept_stats = session.execute(dept_query).all()
    departments_stats = {dept: count for dept, count in dept_stats}
    total_students = sum(departments_stats.values())

    return {
        "dormitory_name": dormitory_name,
        "total_rooms": total_rooms,
        "occupied_rooms": occupied,
        "partially_occupied": partially,
        "free_rooms": free,
        "departments_stats": departments_stats,
        "total_students": total_students,
        "max_students": total_rooms * 2,
    }


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
    num: str, dormitory: str, session: Session
) -> list[FloorResponse]:
    print(
        f"DEBUG: get_by_number_floorordorm called with num={num}, dormitory={dormitory}"
    )

    stat = (
        select(ResidentsBase, Rooms.krovatka)
        .outerjoin(Rooms, ResidentsBase.linenumber == Rooms.linenumber)
        .where(
            or_(
                cast(ResidentsBase.floor, String) == num,
                ResidentsBase.dormitory.like(f"%{num}%"),
            ),
            ResidentsBase.dormitory.like(f"%{dormitory}%"),
        )
    )
    result = session.execute(stat).all()

    return [
        FloorResponse(
            fiz_lico=row[0].fiz_lico,
            start_date=row[0].start_date,
            end_date=row[0].end_date,
            room=str(row[0].room) if row[0].room is not None else None,
            floor=row[0].floor,
            dormitory=row[0].dormitory,
            organisation=row[0].organisation,
            resident_category=row[0].resident_category,
            department=row[0].department,
            krovatka=row[1],
        )
        for row in result
    ]
