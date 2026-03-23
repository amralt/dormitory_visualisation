from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, relationship


Base = declarative_base()


class ResidentsBase(Base):
    __tablename__ = "dogovory"

    linenumber = Column("Номер строки", Integer, primary_key=True)
    period = Column("Период", String)
    registrator = Column("Регистратор", String)
    kontragent = Column("Контрагент", String)
    dogovor_kontragenta = Column("Договор контрагента", String)
    fiz_lico = Column("Физическое лицо", String)
    service_type = Column("Услуга", String)
    organisation = Column("Организация", String)
    isactive = Column("Действует", Integer)
    accomodation_category = Column("Категория жилого помещения", String)
    resident_category = Column("Категория проживающего", String)
    rooms_count = Column("Количество комнат", Integer)
    residents_count = Column("Количество проживающих", Integer)
    total_area = Column("Общая площадь", Integer)
    living_area = Column("Жилая площадь", Integer)
    dormitory = Column("Общежитие", String)
    floor = Column("Этаж", Integer)
    room = Column("Комната", Integer)
    department = Column("Подразделение", String)
    is_main_record = Column("Главная запись", Integer, default=1)
    kinship = Column("Степень родства", String, nullable=True)
    payment_type = Column("Тип оплаты за проживание", String)
    contract_type = Column("Тип договора проживания", String)
    kosgu = Column("КОСГУ", String, nullable=True)
    prefix = Column("Префикс", String, nullable=True)
    sequence_number = Column("Порядковый номер по префиксу", Integer, default=0)
    start_date = Column("Дата начала", String)
    end_date = Column("Дата окончания", String)
    contract_number = Column("Номер договора", String, nullable=True)
    actual_eviction_date = Column("Дата фактического выселения", String, nullable=True)

    rooms = relationship("Rooms", back_populates="resident", uselist=False)

    def __repr__(self):
        return f"{self.kontragent}: {self.dormitory} общежитие\n"


class Rooms(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    linenumber = Column(Integer, ForeignKey("dogovory.Номер строки"), unique=True)
    krovatka = Column("Кроватка", Integer)  # Номер кроватки

    resident = relationship("ResidentsBase", back_populates="rooms")

    def __repr__(self):
        return f"<Rooms(id={self.id}, krovatka={self.krovatka}, room={self.room})>"