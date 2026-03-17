from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ResidentsBase(Base):
    __tablename__ = "dogovory"
    
    id = Column(Integer, primary_key=True)
    period = Column(String)
    registrator = Column(String)
    linenumber = Column(Integer)
    kontragent = Column(String)
    dogovor_kontragenta = Column(String)
    fiz_lico = Column(String)
    service_type = Column(String)
    organisation = Column(String)
    isactive = Column(Integer)
    accomodation_category = Column(String)
    resident_category = Column(String)
    rooms_count = Column(Integer)
    residents_count = Column(Integer)
    total_area = Column(Integer)
    living_area = Column(Integer)
    dormitory = Column(String)
    floor = Column(Integer)
    room = Column(Integer)
    department = Column(String)
    is_main_record = Column(Integer, default=1) 
    kinship = Column(String, nullable=True)
    payment_type = Column(String)              
    contract_type = Column(String)           
    kosgu = Column(String, nullable=True)       
    prefix = Column(String, nullable=True)        
    sequence_number = Column(Integer, default=0)  
    start_date = Column(String)                     
    end_date = Column(String)                      
    contract_number = Column(String, nullable=True)
    actual_eviction_date = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<ResidentsBase(id={self.id}, kontragent={self.kontragent})>"
