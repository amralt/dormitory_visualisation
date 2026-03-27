from app.core.config import SEARCH_BY_NAME, SEARCH_BY_ID, SEARCH_BY_ROOM
# from app.db.crud import 


#TODO: можно сделать индикаторы поиска. Задача возможно на будущее

def get_search_type(qwery: str):
    if qwery.isdigit():
        if len(qwery) > 4:
            return SEARCH_BY_ID
        return SEARCH_BY_ROOM

    else:
        print("name?")
        return SEARCH_BY_NAME