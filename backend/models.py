from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint
from datetime import datetime
from backend.database import Base


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = (CheckConstraint("score > 0", name="check_score_positive"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    pseudo = Column(String(20), nullable=False, default="Anonyme")
    score = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
