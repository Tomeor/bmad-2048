from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from typing import List
import os
from dotenv import load_dotenv

from backend.database import SessionLocal, create_tables
from backend.models import Score
from backend.schemas import ScoreIn, ScoreOut, RankResponse

load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")

# === RATE LIMITING ===
limiter = Limiter(key_func=get_remote_address)


# === APP ===
app = FastAPI()

# CORS — origines autorisées exclusivement depuis variable d'environnement (FR28)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SlowAPI middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


# Handler 429 custom — format { "detail": "..." } conforme au contrat API
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again later."},
    )


app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)


# === STARTUP ===
@app.on_event("startup")
def startup():
    create_tables()


# === DEPENDENCY ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# === API ROUTES (déclarées AVANT StaticFiles) ===

@app.post("/scores", response_model=RankResponse)
@limiter.limit("10/minute")
def submit_score(request: Request, score_in: ScoreIn, db: Session = Depends(get_db)):
    # Normalisation pseudo : None ou chaîne vide → "Anonyme" (FR9)
    pseudo = score_in.pseudo if score_in.pseudo and score_in.pseudo.strip() else "Anonyme"

    # Insertion en DB
    new_score = Score(pseudo=pseudo, score=score_in.score)
    db.add(new_score)
    db.commit()
    db.refresh(new_score)

    # Rang = nombre de scores strictement supérieurs + 1
    rank = db.query(Score).filter(Score.score > score_in.score).count() + 1

    return RankResponse(id=new_score.id, rank=rank)


@app.get("/scores/top10", response_model=List[ScoreOut])
def get_top10(db: Session = Depends(get_db)):
    return db.query(Score).order_by(Score.score.desc()).limit(10).all()


# === STATIC FILES (montées EN DERNIER — après toutes les routes API) ===
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
