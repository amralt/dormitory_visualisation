from fastapi import APIRouter
from app.api.routes.floor import floor_router


api_router = APIRouter(prefix="/api")
api_router.include_router(floor_router)


