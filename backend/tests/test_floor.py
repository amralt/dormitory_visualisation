import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_students_by_floor():
    response = client.get("/api/floor/1/students")
    print(f"Response status: {response.status_code}")
    # print(f"Response body: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["students"], list)
    
    # Test non-existent floor
    response = client.get("/api/floor/999/students")
    assert response.status_code == 404

if __name__ == "__main__":
    test_get_students_by_floor()
    print("All tests passed!")