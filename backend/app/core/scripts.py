from app.core.config import SEARCH_BY_NAME, SEARCH_BY_ID, SEARCH_BY_ROOM, SEARCH_BY_ROOM_AND_ID
# from app.db.crud import 


#TODO: можно сделать индикаторы поиска. Задача возможно на будущее

def get_search_type(qwery: str):
    if qwery.isdigit():
        return SEARCH_BY_ROOM_AND_ID
    
    
    if qwery.startswith("Комната "):
        return SEARCH_BY_ROOM
    if qwery.startswith("Договор ") or qwery.startswith("Направление "):
        return SEARCH_BY_ID

    return SEARCH_BY_NAME