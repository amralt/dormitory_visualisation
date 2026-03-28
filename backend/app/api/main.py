from fastapi import APIRouter
from app.api.routes.floor import floor_router
from app.api.routes.search import search_router
from app.api.routes.residents import router as residents_router


api_router = APIRouter(prefix="/api")
api_router.include_router(floor_router)
api_router.include_router(search_router)
api_router.include_router(residents_router)
