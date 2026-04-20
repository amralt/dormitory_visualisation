
SEARCH_BY_NAME = "SEARCH_BY_NAME"
SEARCH_BY_ROOM = "SEARCH_BY_ROOM"
SEARCH_BY_ID = "SEARCH_BY_ID"
SEARCH_BY_ROOM_AND_ID = "SEARCH_BY_ROOM_AND_ID"

USERS = [
    {
        "id": 1,
        "username": "admin",
        "password": "123",
        "role": "admin",
        "available_faculties": ["*"], # Спецсимвол для доступа ко всем
    },
    {
        "id": 2,
        "username": "ff_decan",
        "password": "123",
        "role": "decan",
        "available_faculties": ["ФФ"], # Видит ФФ полностью, остальных — анонимно
    },
    {
        "id": 3,
        "username": "mmf_decan",
        "password": "123",
        "role": "decan",
        "available_faculties": ["ММФ"],
    }
]