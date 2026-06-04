import secrets
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import get_current_user, require_role
from .. import models, schemas

router = APIRouter(prefix="/api/mecanicos", tags=["mecanicos"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
ALLOWED_EXT = {
    ".jpg", ".jpeg", ".jpe", ".jfif",
    ".png",
    ".webp",
    ".gif",
    ".avif",
    ".bmp",
    ".tif", ".tiff",
    ".heic", ".heif",
    ".ico",
}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_FOTOS = 6


@router.get("", response_model=list[schemas.MecanicoCard])
def listar(
    q: Optional[str] = Query(default=None),
    categoria: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Mecanico)
        .join(models.Usuario, models.Usuario.id == models.Mecanico.usuario_id)
        .options(
            selectinload(models.Mecanico.usuario),
            selectinload(models.Mecanico.servicios),
        )
        .filter(models.Mecanico.aprobado == True, models.Usuario.activo == True)
        .order_by(models.Mecanico.calificacion_promedio.desc())
    )
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Usuario.nombre.ilike(like),
                models.Mecanico.especialidades.ilike(like),
                models.Mecanico.ubicacion.ilike(like),
            )
        )

    mecanicos = query.all()

    if categoria:
        cat = categoria.lower()
        mecanicos = [
            m
            for m in mecanicos
            if any(s.categoria.lower() == cat for s in m.servicios if s.activo)
        ]

    # Solo servicios activos en la respuesta
    for m in mecanicos:
        m.servicios = [s for s in m.servicios if s.activo]

    return mecanicos


@router.get("/dashboard", response_model=schemas.DashboardMecanicoOut)
def dashboard(
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    mec = db.query(models.Mecanico).filter(models.Mecanico.usuario_id == user.id).first()
    if not mec:
        raise HTTPException(status_code=404, detail="No es un mecánico")

    base_q = db.query(models.Cita).filter(models.Cita.mecanico_id == mec.id)
    return {
        "citas_pendientes": base_q.filter(
            models.Cita.estado == models.EstadoCita.pendiente
        ).count(),
        "citas_aceptadas": base_q.filter(
            models.Cita.estado == models.EstadoCita.aceptada
        ).count(),
        "citas_finalizadas": base_q.filter(
            models.Cita.estado == models.EstadoCita.finalizada
        ).count(),
        "total_citas": base_q.count(),
        "calificacion_promedio": mec.calificacion_promedio,
        "total_trabajos": mec.total_trabajos,
        "aprobado": mec.aprobado,
    }


@router.put("/perfil", response_model=schemas.MecanicoOut)
def actualizar_perfil(
    data: schemas.MecanicoUpdate,
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    mec = db.query(models.Mecanico).filter(models.Mecanico.usuario_id == user.id).first()
    if not mec:
        raise HTTPException(status_code=404, detail="Perfil de mecánico no encontrado")

    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(mec, k, v)
    db.commit()
    db.refresh(mec)
    return mec


@router.post("/perfil/fotos", response_model=schemas.MecanicoOut)
async def subir_foto_referencia(
    file: UploadFile = File(...),
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    mec = db.query(models.Mecanico).filter(models.Mecanico.usuario_id == user.id).first()
    if not mec:
        raise HTTPException(status_code=404, detail="Perfil de mecánico no encontrado")

    actuales = [u for u in (mec.fotos_referencia or "").split(",") if u]
    if len(actuales) >= MAX_FOTOS:
        raise HTTPException(
            status_code=400, detail=f"Máximo {MAX_FOTOS} fotos de referencia"
        )

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT or (
        file.content_type and not file.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Acepta JPG, PNG, WEBP, GIF, AVIF, BMP, TIFF, HEIC, ICO.",
        )

    contenido = await file.read()
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="La foto supera los 10 MB")
    if len(contenido) == 0:
        raise HTTPException(status_code=400, detail="Archivo vacío")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    nombre = f"mec{mec.id}_{secrets.token_hex(8)}{ext}"
    destino = UPLOADS_DIR / nombre
    destino.write_bytes(contenido)

    url = f"/uploads/{nombre}"
    actuales.append(url)
    mec.fotos_referencia = ",".join(actuales)
    db.commit()
    db.refresh(mec)
    return mec


@router.delete("/perfil/fotos", response_model=schemas.MecanicoOut)
def borrar_foto_referencia(
    url: str = Query(..., description="URL de la foto a borrar"),
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    mec = db.query(models.Mecanico).filter(models.Mecanico.usuario_id == user.id).first()
    if not mec:
        raise HTTPException(status_code=404, detail="Perfil de mecánico no encontrado")

    actuales = [u for u in (mec.fotos_referencia or "").split(",") if u]
    if url not in actuales:
        raise HTTPException(status_code=404, detail="Foto no encontrada en el perfil")

    actuales.remove(url)
    mec.fotos_referencia = ",".join(actuales) if actuales else None

    # borrar archivo físico si está dentro de /uploads
    try:
        nombre = url.rsplit("/", 1)[-1]
        ruta = UPLOADS_DIR / nombre
        if ruta.is_file() and ruta.resolve().is_relative_to(UPLOADS_DIR.resolve()):
            ruta.unlink(missing_ok=True)
    except Exception:
        pass

    db.commit()
    db.refresh(mec)
    return mec


@router.get("/{mec_id}", response_model=schemas.MecanicoOut)
def detalle(mec_id: int, db: Session = Depends(get_db)):
    mec = (
        db.query(models.Mecanico)
        .options(
            selectinload(models.Mecanico.usuario),
            selectinload(models.Mecanico.servicios),
            selectinload(models.Mecanico.resenas).selectinload(models.Resena.cliente),
        )
        .filter(models.Mecanico.id == mec_id)
        .first()
    )
    if not mec:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    mec.servicios = [s for s in mec.servicios if s.activo]
    mec.resenas = sorted(mec.resenas, key=lambda r: r.fecha, reverse=True)
    return mec
