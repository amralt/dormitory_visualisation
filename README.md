# Система визуализации проживания в общежитиях (СтудГородок)

Проект состоит из бэкенда на **FastAPI** и фронтенда на **React (Vite)**.  
Позволяет просматривать заселение по этажам, комнатам, факультетам, выгружать данные в Excel, а также управлять видимостью общежитий и доступом пользователей.

## 📦 Быстрый старт

### 1. Требования
- **Python** 3.10+
- **Node.js** 18+ и **npm**
- **Git** (опционально)

### 2. Клонирование и установка

```
git clone https://github.com/amralt/dormitory_visualisation.git
cd dormitory_visualisation
```

### 3. База данных
В бэкенде по умолчанию используется SQLite‑база dogovory.db, которая создаётся автоматически в корневой папке бэкенда.
скачайте её из https://drive.google.com/file/d/1ex4iBBagW_xEjkbUAyxxZnGasoHCkVF4/view?usp=sharing и вставьте в папку backend

### 4. Запуск проекта:
`dockuer-compose up --build`

🧱 Структура проекта
text
```
backend/
├── app/
│   ├── api/                 # Маршруты и Pydantic-схемы
│   │   ├── routes/          # Эндпоинты по модулям
│   │   │   ├── dormitory.py   # /api/dormitory/...
│   │   │   ├── floor.py       # /api/floor/...
│   │   │   ├── residents.py   # /api/residents/filter
│   │   │   └── search.py      # /api/residents/search_students
│   │   ├── schemas.py       # Pydantic модели для запросов/ответов
│   │   └── main.py          # Подключение всех роутеров (api_router)
│   ├── auth.py              # Аутентификация: /login, get_current_user (по X-User-ID)
│   ├── core/                # Конфигурация и утилиты
│   │   ├── config.py        # USERS, DORMITORIES, константы поиска
│   │   └── scripts.py       # Определение типа поиска (get_search_type)
│   ├── db/                  # Работа с базой данных
│   │   ├── db.py            # engine, SessionLocal, get_session
│   │   ├── models.py        # SQLAlchemy модели (ResidentsBase, Rooms)
│   │   └── crud.py          # Основные запросы к БД с учётом прав доступа (apply_mask)
│   └── main.py              # FastAPI приложение, CORS, include_router
├── requirements.txt
└── Dockerfile

visualisation_frontend/      # React-приложение (Vite)
├── src/
│   ├── pages/               # Компоненты-страницы
│   │   ├── LoginPage.jsx
│   │   ├── CampusCards.jsx
│   │   ├── DormitoryStats.jsx
│   │   ├── DormMap.jsx
│   │   ├── Dashboard.jsx
│   │   └── Download.jsx
│   ├── components/          # Переиспользуемые компоненты (Header, SearchInput, FilterDropdown)
│   ├── api.js               # Все запросы к бэкенду (BASE_URL, заголовок X-User-ID)
│   ├── App.jsx              # Роутинг (условный – через состояние currentPage)
│   └── main.jsx             # Точка входа React
├── package.json
└── index.html
```

🔗 Связь фронтенда и бэкенда

Фронтенд обращается к бэкенду через REST API по адресу http://localhost:8000.
Все вызовы инкапсулированы в файле visualisation_frontend/src/pages/api.js:

    BASE_URL = 'http://localhost:8000' – при необходимости измените на реальный адрес сервера.

    После успешного логина в localStorage сохраняется userId.
    Каждый последующий запрос автоматически добавляет заголовок X-User-ID с этим значением.

    Бэкенд в auth.py читает этот заголовок и определяет роль и доступные факультеты пользователя (через функцию get_current_user).

Пример вызова с фронтенда:
```javascript

import { searchStudents } from './api';
const results = await searchStudents('Иванов', dormitory);
```

🔐 Аутентификация и права доступа

Аутентификация упрощённая – передача числового user_id в заголовке X-User-ID (без JWT).
Пользователи и их права заданы в файле backend/app/core/config.py:
python

USERS = [
    {"id": 1, "username": "admin", "password": "123", "role": "admin", "available_faculties": ["*"]},
    {"id": 2, "username": "ff_decan", "password": "123", "role": "decan", "available_faculties": ["ФФ"]},
    ...
]

    admin – видит все данные.

    decan – видит полные данные только по своим факультетам (available_faculties); для остальных факультетов данные маскируются (ФИО заменяется, даты скрываются). Логика маскировки – в app/db/crud.py (функция apply_mask).

    ⚠️ Мы не занимались авторизацией

---

## 🔗 Связь фронтенда и бэкенда

Фронтенд обращается к бэкенду через **REST API** по адресу `http://localhost:8000`.  
Все вызовы инкапсулированы в файле `visualisation_frontend/src/pages/api.js`:

- `BASE_URL = 'http://localhost:8000'` – при необходимости измените на реальный адрес сервера.
- После успешного логина в `localStorage` сохраняется `userId`.  
  Каждый последующий запрос автоматически добавляет заголовок `X-User-ID` с этим значением.
- Бэкенд в `auth.py` читает этот заголовок и определяет роль и доступные факультеты пользователя (через функцию `get_current_user`).

**Пример вызова с фронтенда:**
```javascript
import { searchStudents } from './api';
const results = await searchStudents('Иванов', dormitory);
```

---

## 🔐 Аутентификация и права доступа

Аутентификация **упрощённая** – передача числового `user_id` в заголовке `X-User-ID` (без JWT).  
Пользователи и их права заданы в файле `backend/app/core/config.py`:

```python
USERS = [
    {"id": 1, "username": "admin", "password": "123", "role": "admin", "available_faculties": ["*"]},
    {"id": 2, "username": "ff_decan", "password": "123", "role": "decan", "available_faculties": ["ФФ"]},
    ...
]
```

- **admin** – видит все данные.
- **decan** – видит полные данные только по своим факультетам (`available_faculties`); для остальных факультетов данные маскируются (ФИО заменяется, даты скрываются). Логика маскировки – в `app/db/crud.py` (функция `apply_mask`).

> ⚠️ В реальной системе замените на полноценную аутентификацию (JWT, хеширование паролей). Сейчас пароли хранятся в открытом виде.

---

## 📡 Основные эндпоинты API

| Метод | URL | Описание | Права |
|-------|-----|----------|-------|
| POST | `/api/login?username=...&password=...` | Аутентификация, возвращает `user_id`, `username`, `role`, `faculties` | – |
| GET | `/api/residents/filter` | Фильтрация проживающих по этажу, факультету, категории, датам и т.д. | Зависит от роли (маскировка) |
| GET | `/api/residents/search_students/?qwery=...&dormitory=...` | Умный поиск (по ФИО, номеру комнаты, номеру договора) | Маскировка по факультетам |
| GET | `/api/floor/{floor_number}/students?dormitory=...` | Список студентов на указанном этаже конкретного общежития | Маскировка |
| GET | `/api/dormitory/` | Список всех общежитий с флагом `visible` (из `config.DORMITORIES`) | Открытый |
| GET | `/api/dormitory/{dormitory_name}/stats` | Статистика по общежитию: занятость, факультеты, количество студентов | Открытый |

**Полная спецификация** доступна в интерактивной документации:  
`http://localhost:8000/docs`

---

## 🗂️ Работа с базой данных

- Используется **SQLite** (файл `dogovory.db`). Модели находятся в `app/db/models.py`.
- Для миграций (при изменении моделей) рекомендуется **Alembic**. Конфигурация уже есть в `requirements.txt` (`alembic<2.0.0`).
- **Инициализация БД** происходит автоматически при первом запуске через `Base.metadata.create_all(bind=engine)` в `app/main.py`.
- **CRUD-операции** вынесены в `app/db/crud.py`. Ключевые функции:
  - `filter` – универсальный фильтр.
  - `get_by_namepart`, `get_by_id_dogovor`, `get_by_room_num` – для поиска.
  - `get_dormitory_stats` – собирает статистику по общежитию.
  - `apply_mask` – применяет правила видимости к ответу.

---

## 🧪 Дополнительные настройки

### Видимость общежитий на главной
В `backend/app/core/config.py` есть список `DORMITORIES` с полем `visible`:

```python
DORMITORIES = [
    {"name": "Общежитие 1а", "visible": False},
    {"name": "Общежитие 2", "visible": True},
    ...
]
```

Фронтенд загружает этот список через эндпоинт `/api/dormitory/`.

### Типы поиска (логика в `app/core/scripts.py`)
- Если строка поиска состоит только из цифр → ищет **одновременно по номеру комнаты и номеру договора**.
- Начинается с «Комната » → поиск по комнате.
- Начинается с «Договор » или «Направление » → поиск по ID договора.
- Иначе – поиск по ФИО (контрагенту).

---

## 📜 Лицензия и контакты
tg: AltinAmir (https://t.me/AltinAmir), @HomenZZ (https://t.me/HomenZZ)
