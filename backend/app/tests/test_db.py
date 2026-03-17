import pytest
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
import random

# Импортируем модели и базовый класс из вашего модуля (например, main)
from app.db.models import ResidentsBase
from app.db.db import Base 

# Фикстура для временной базы данных в памяти
@pytest.fixture
def in_memory_db():
    """Создаёт in-memory SQLite базу и все таблицы."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()

# Фикстура для заполнения таблицы dogovory тестовыми данными
@pytest.fixture
def populated_session(in_memory_db):
    """Добавляет несколько записей в таблицу dogovory."""
    test_residents = [
        ResidentsBase(
            period="2025-01",
            registrator="Иванов",
            linenumber=1,
            kontragent="ООО Ромашка",
            dogovor_kontragenta="Д-001",
            fiz_lico="Петров А.А.",
            service_type="Аренда",
            organisation="ЖКХ",
            isactive=1,
            accomodation_category="Стандарт",
            resident_category="Студент",
            rooms_count=1,
            residents_count=1,
            total_area=30,
            living_area=25,
            dormitory="Общежитие №1",
            floor=2,
            room=201,
            department="АХО",
            is_main_record=1,
            kinship=None,
            payment_type="Наличные",
            contract_type="Основной",
            kosgu="310",
            prefix="А",
            sequence_number=1,
            start_date="2025-01-01",
            end_date="2025-12-31",
            contract_number="А-001",
            actual_eviction_date=None
        ),
        ResidentsBase(
            period="2025-01",
            registrator="Петров",
            linenumber=2,
            kontragent="ООО Василек",
            dogovor_kontragenta="Д-002",
            fiz_lico="Сидоров С.С.",
            service_type="Коммунальные",
            organisation="ЖКХ",
            isactive=1,
            accomodation_category="Люкс",
            resident_category="Аспирант",
            rooms_count=2,
            residents_count=2,
            total_area=50,
            living_area=45,
            dormitory="Общежитие №2",
            floor=3,
            room=305,
            department="Учебный",
            is_main_record=1,
            kinship=None,
            payment_type="Безналичный",
            contract_type="Дополнительный",
            kosgu="320",
            prefix="Б",
            sequence_number=2,
            start_date="2025-02-01",
            end_date="2025-06-01",
            contract_number="Б-002",
            actual_eviction_date=None
        ),
        ResidentsBase(
            period="2025-02",
            registrator="Сидоров",
            linenumber=3,
            kontragent="ИП Иванов",
            dogovor_kontragenta="Д-003",
            fiz_lico="Иванов И.И.",
            service_type="Аренда",
            organisation="ЖКХ",
            isactive=0,
            accomodation_category="Стандарт",
            resident_category="Студент",
            rooms_count=1,
            residents_count=1,
            total_area=28,
            living_area=22,
            dormitory="Общежитие №1",
            floor=4,
            room=410,
            department="АХО",
            is_main_record=1,
            kinship=None,
            payment_type="Наличные",
            contract_type="Основной",
            kosgu="310",
            prefix="В",
            sequence_number=3,
            start_date="2025-03-01",
            end_date="2025-08-31",
            contract_number="В-003",
            actual_eviction_date=None
        ),
    ]
    for res in test_residents:
        in_memory_db.add(res)
    in_memory_db.commit()
    return in_memory_db

# Тест 1: Проверка соединения с базой данных
def test_database_connection():
    """
    Проверяет, что можно установить соединение с базой данных
    и выполнить простой запрос (например, получить версию SQLite).
    """
    engine = create_engine("sqlite:///:memory:", echo=False)
    try:
        connection = engine.connect()
        result = connection.execute("SELECT 1").scalar()
        assert result == 1, "Не удалось выполнить простой запрос к базе"
        connection.close()
    except Exception as e:
        pytest.fail(f"Ошибка подключения к базе данных: {e}")

# Тест 2: Получение одного случайного человека из таблицы dogovory
def test_get_random_person(populated_session):
    """
    Проверяет, что из таблицы dogovory можно получить одну случайную запись.
    Используется функция random() для выбора случайной строки.
    """
    # Для SQLite можно использовать func.random()
    random_person = populated_session.query(ResidentsBase).order_by(func.random()).first()
    
    assert random_person is not None, "Не удалось получить случайную запись: таблица пуста"
    assert hasattr(random_person, "kontragent"), "Запись не содержит поле kontragent"
    assert isinstance(random_person.kontragent, str), "Поле kontragent должно быть строкой"
    # Дополнительно можно проверить наличие других обязательных полей
    assert random_person.id is not None, "Запись не имеет идентификатора"

# Тест 3: Проверка, что при пустой таблице возвращается None
def test_get_random_person_from_empty_table(in_memory_db):
    """
    Проверяет поведение при попытке получить случайную запись из пустой таблицы.
    Ожидается, что запрос вернёт None.
    """
    random_person = in_memory_db.query(ResidentsBase).order_by(func.random()).first()
    assert random_person is None, "Из пустой таблицы должен возвращаться None"

# Тест 4: Альтернативный способ получения "случайной" записи через Python
def test_get_random_person_python_random(populated_session):
    """
    Получение всех записей и выбор случайной средствами Python.
    Этот метод может быть полезен, если func.random() не поддерживается СУБД.
    """
    all_persons = populated_session.query(ResidentsBase).all()
    assert len(all_persons) > 0, "Таблица не должна быть пустой"
    
    random_person = random.choice(all_persons)
    assert random_person is not None
    assert random_person.kontragent in ["ООО Ромашка", "ООО Василек", "ИП Иванов"]

# Примечание: для корректной работы тестов убедитесь, что в основном модуле (main)
# определён Base, ResidentsBase, Student и session_scope, а также нет конфликтов
# с двойным определением Base (лучше оставить одно объявление перед моделями).