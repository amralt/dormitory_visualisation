from fastapi import APIRouter, HTTPException, Header
from app.core.config import USERS

auth_router = APIRouter(tags=["auth"])

@auth_router.post("/login")
def login(username: str, password: str):
    user = next((u for u in USERS if u["username"] == username and u["password"] == password), None)
    if not user:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    
    # Возвращаем информацию о пользователе (без пароля)
    return {
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "faculties": user["available_faculties"]
    }

def get_current_user(x_user_id: int = Header(..., alias="X-User-ID")):
    user = next((u for u in USERS if u["id"] == x_user_id), None)
    if not user:
        raise HTTPException(status_code=401, detail="User session invalid")
    return user