from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base 

DATABASE_URL = 'sqlite:///dogovory.db'
engine = create_engine(DATABASE_URL, echo=False)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)
def get_session():
    return SessionLocal()

from contextlib import contextmanager

@contextmanager
def session_scope():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()
