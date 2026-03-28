from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.db.models import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///dogovory.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True,  
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()