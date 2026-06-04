from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .database import Base, engine
from .routers import auth, mecanicos, servicios, citas, resenas, admin, soporte

Base.metadata.create_all(bind=engine)


def _aplicar_migraciones_ligeras():
    # Permitir reseñas directas de perfil (sin cita asociada)
    with engine.begin() as conn:
        try:
            conn.execute(
                text('ALTER TABLE resenas ALTER COLUMN "citaId" DROP NOT NULL')
            )
        except Exception:
            pass


_aplicar_migraciones_ligeras()

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="MecanicGo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/")
def root():
    return {"ok": True, "name": "MecanicGo API", "version": "1.0.0"}


app.include_router(auth.router)
app.include_router(mecanicos.router)
app.include_router(servicios.router)
app.include_router(citas.router)
app.include_router(resenas.router)
app.include_router(admin.router)
app.include_router(soporte.router)
