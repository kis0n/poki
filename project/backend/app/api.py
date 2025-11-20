from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from .database import get_db
from .models import Reminder, User

router = APIRouter()

@router.get("/reminders/{user_id}")
def get_reminders(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(Reminder).filter(Reminder.user_id == user_id).all()

@router.post("/reminders")
def add_reminder(
    user_id: int,
    text: str,
    remind_at: datetime,
    db: Session = Depends(get_db)
):
    # Проверяем существующее напоминание
    existing = db.query(Reminder).filter(
        Reminder.user_id == user_id,
        Reminder.text == text,
        Reminder.remind_at == remind_at
    ).first()

    if existing:
        existing.text = text
        existing.remind_at = remind_at
        db.commit()
        db.refresh(existing)
        return existing

    reminder = Reminder(
        user_id=user_id,
        text=text,
        remind_at=remind_at
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    db.delete(reminder)
    db.commit()
    return {"message": "Reminder deleted successfully"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)   # thanks to cascade="all, delete"
    db.commit()
    return {"message": "User and all reminders deleted"}

from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str | None = None

@router.post("/users", status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
