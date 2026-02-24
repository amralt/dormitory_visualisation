from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from api.main import api_router

# Создаем экземпляр приложения
app = FastAPI()

# Определяем операцию пути (GET запрос)
@app.get("/")
def read_root():
    return {"Hello": "World"}


# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)