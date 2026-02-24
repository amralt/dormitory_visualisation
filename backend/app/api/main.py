'''
Этот файл нужен, чтобы собрать все роуты в одном месте, 
потом api_router будет использован в main в app 

'''
from fastapi import APIRouter
from api.routes import floor, student

api_router = APIRouter()


