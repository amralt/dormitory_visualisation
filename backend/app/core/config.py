
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

DORMITORIES = [
    {"name": "Общежитие 1а", "visible": False},
    {"name": "Общежитие 1б", "visible": False},
    {"name": "Общежитие 2", "visible": True},
    {"name": "Общежитие 3", "visible": False},
    {"name": "Общежитие 5", "visible": False},
    {"name": "Общежитие 6", "visible": False},
    {"name": "Общежитие 8", "visible": False},
]
