from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import get_current_user, require_role
from .. import models, schemas

router = APIRouter(prefix="/api/resenas", tags=["resenas"])


def _recalcular_promedio(db: Session, mecanico_id: int) -> None:
    avg = (
        db.query(func.avg(models.Resena.calificacion))
        .filter(models.Resena.mecanico_id == mecanico_id)
        .scalar()
    )
    mec = db.query(models.Mecanico).filter(models.Mecanico.id == mecanico_id).first()
    if mec:
        mec.calificacion_promedio = float(avg or 0)


@router.post("", response_model=schemas.ResenaOut, status_code=201)
def crear(
    data: schemas.ResenaCreate,
    user: models.Usuario = Depends(require_role("cliente")),
    db: Session = Depends(get_db),
):
    if data.calificacion < 1 or data.calificacion > 5:
        raise HTTPException(status_code=400, detail="Calificación debe estar entre 1 y 5")

    # --- Flujo 1: reseña ligada a una cita finalizada ---
    if data.cita_id:
        cita = (
            db.query(models.Cita)
            .options(selectinload(models.Cita.resena))
            .filter(models.Cita.id == data.cita_id)
            .first()
        )
        if not cita or cita.cliente_id != user.id:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        if cita.estado != models.EstadoCita.finalizada:
            raise HTTPException(status_code=400, detail="Solo puedes calificar citas finalizadas")
        if cita.resena:
            raise HTTPException(status_code=409, detail="Ya calificaste esta cita")

        resena = models.Resena(
            cita_id=cita.id,
            cliente_id=user.id,
            mecanico_id=cita.mecanico_id,
            calificacion=data.calificacion,
            comentario=data.comentario,
        )
        db.add(resena)
        db.flush()
        _recalcular_promedio(db, cita.mecanico_id)
        db.commit()
        db.refresh(resena)
        return resena

    # --- Flujo 2: reseña directa desde el perfil del mecánico ---
    if not data.mecanico_id:
        raise HTTPException(
            status_code=400, detail="Debes indicar la cita o el mecánico a calificar"
        )

    mec = db.query(models.Mecanico).filter(models.Mecanico.id == data.mecanico_id).first()
    if not mec:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")

    # Evitar que un mismo cliente deje varias reseñas "de perfil" al mismo mecánico
    existente = (
        db.query(models.Resena)
        .filter(
            models.Resena.mecanico_id == data.mecanico_id,
            models.Resena.cliente_id == user.id,
            models.Resena.cita_id.is_(None),
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=409,
            detail="Ya dejaste una reseña en el perfil de este mecánico",
        )

    resena = models.Resena(
        cita_id=None,
        cliente_id=user.id,
        mecanico_id=data.mecanico_id,
        calificacion=data.calificacion,
        comentario=data.comentario,
    )
    db.add(resena)
    db.flush()
    _recalcular_promedio(db, data.mecanico_id)
    db.commit()
    db.refresh(resena)
    return resena


@router.get("/mecanico/{mec_id}", response_model=list[schemas.ResenaOut])
def por_mecanico(mec_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Resena)
        .options(selectinload(models.Resena.cliente))
        .filter(models.Resena.mecanico_id == mec_id)
        .order_by(models.Resena.fecha.desc())
        .all()
    )


@router.delete("/{rid}", status_code=200)
def eliminar(
    rid: int,
    user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soporte y admin pueden eliminar reseñas inapropiadas."""
    if user.rol.value not in {"admin", "soporte"}:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar reseñas")

    resena = db.query(models.Resena).filter(models.Resena.id == rid).first()
    if not resena:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    mec_id = resena.mecanico_id
    db.delete(resena)
    db.flush()
    _recalcular_promedio(db, mec_id)
    db.commit()
    return {"ok": True}
