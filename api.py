from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

DATABASE_URL = "postgresql://username:931752@localhost:5432/gestion_listes"
engine = create_engine(DATABASE_URL)

Base = declarative_base()

class ListModel(Base):
    __tablename__ = "lists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    archived = Column(Boolean, default=False)
    items = relationship("ItemModel", back_populates="list")

class ItemModel(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("lists.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    validated = Column(Boolean, default=False)
    list = relationship("ListModel", back_populates="items")

# Création des tables
Base.metadata.create_all(bind=engine)

# Session de base de données
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Modèles Pydantic
class ItemCreate(BaseModel):
    name: str
    quantity: int = 1

class ItemResponse(ItemCreate):
    id: int
    validated: bool

class ListCreate(BaseModel):
    name: str

class ListResponse(BaseModel):
    id: int
    name: str
    archived: bool
    items: List[ItemResponse] = []

app = FastAPI()

# Routes API
@app.get("/lists", response_model=List[ListResponse])
def get_lists():
    db = SessionLocal()
    lists = db.query(ListModel).all()
    return lists

@app.post("/lists", response_model=ListResponse)
def create_list(list_data: ListCreate):
    db = SessionLocal()
    new_list = ListModel(name=list_data.name)
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list

@app.post("/lists/{list_id}/items", response_model=ItemResponse)
def add_item(list_id: int, item_data: ItemCreate):
    db = SessionLocal()
    list_obj = db.query(ListModel).filter(ListModel.id == list_id).first()
    if not list_obj:
        raise HTTPException(status_code=404, detail="Liste non trouvée")
    new_item = ItemModel(name=item_data.name, quantity=item_data.quantity, list_id=list_id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.put("/lists/{list_id}/archive")
def archive_list(list_id: int):
    db = SessionLocal()
    list_obj = db.query(ListModel).filter(ListModel.id == list_id).first()
    if not list_obj:
        raise HTTPException(status_code=404, detail="Liste non trouvée")
    if all(item.validated for item in list_obj.items):
        list_obj.archived = True
        db.commit()
        return {"message": "Liste archivée"}
    raise HTTPException(status_code=400, detail="Tous les items ne sont pas validés")

@app.put("/lists/{list_id}/items/{item_id}/validate")
def validate_item(list_id: int, item_id: int):
    db = SessionLocal()
    item = db.query(ItemModel).filter(ItemModel.id == item_id, ItemModel.list_id == list_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item non trouvé")
    item.validated = True
    db.commit()
    return {"message": "Item validé"}

@app.delete("/lists/{list_id}/items/{item_id}")
def delete_item(list_id: int, item_id: int):
    db = SessionLocal()
    item = db.query(ItemModel).filter(ItemModel.id == item_id, ItemModel.list_id == list_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item non trouvé")
    db.delete(item)
    db.commit()
    return {"message": "Item supprimé"}