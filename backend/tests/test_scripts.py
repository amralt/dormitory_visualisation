import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.scripts import get_search_type
from app.core.config import SEARCH_BY_ROOM, SEARCH_BY_ID, SEARCH_BY_NAME



def test_get_search_type():
    ans = get_search_type("332")
    assert ans == SEARCH_BY_ROOM
    
    ans = get_search_type("Amir")
    assert ans == SEARCH_BY_NAME

    ans = get_search_type("5555444")
    assert ans == SEARCH_BY_ID

    

if __name__ == "__main__":
    test_get_search_type()
    print("All tests passed!")