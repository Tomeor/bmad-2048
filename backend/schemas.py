from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class ScoreIn(BaseModel):
    pseudo: Optional[str] = Field(None, max_length=20)
    score: int = Field(..., gt=0)


class ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pseudo: str
    score: int
    created_at: datetime


class RankResponse(BaseModel):
    id: int
    rank: int
