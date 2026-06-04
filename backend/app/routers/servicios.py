from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_role
from .. import models, schemas

router = APIRouter(prefix="/api/servicios", tags=["servicios"])

CATEGORIAS = [
    "Mantenimiento",
    "Frenos",
    "Motor",
    "Transmisión",
    "Eléctrico",
    "Llantas",
    "Diagnóstico",
    "Suspensión",
    "Aire acondicionado",
    "General",
]


@router.get("/categorias", response_model=list[str])
def listar_categorias():
    return CATEGORIAS


@router.get("/mecanico/{mec_id}", response_model=list[schemas.ServicioOut])
def listar_por_mecanico(mec_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Servicio)
        .filter(models.Servicio.mecanico_id == mec_id, models.Servicio.activo == True)
        .order_by(models.Servicio.nombre.asc())
        .all()
    )


def _mec_id_de_usuario(db: Session, user_id: int) -> int | None:
    mec = db.query(models.Mecanico).filter(models.Mecanico.usuario_id == user_id).first()
    return mec.id if mec else None


@router.post("", response_model=schemas.ServicioOut, status_code=201)
def crear(
    data: schemas.ServicioCreate,
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    mec_id = _mec_id_de_usuario(db, user.id)
    if not mec_id:
        raise HTTPException(status_code=404, detail="Perfil de mecánico no encontrado")

    s = models.Servicio(
        mecanico_id=mec_id,
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio=data.precio,
        duracion_minutos=data.duracion_minutos,
        categoria=data.categoria,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.put("/{sid}", response_model=schemas.ServicioOut)
def actualizar(
    sid: int,
    data: schemas.ServicioUpdate,
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    mec_id = _mec_id_de_usuario(db, user.id)
    s = db.query(models.Servicio).filter(models.Servicio.id == sid).first()
    if not s or s.mecanico_id != mec_id:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{sid}")
def eliminar(
    sid: int,
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    mec_id = _mec_id_de_usuario(db, user.id)
    s = db.query(models.Servicio).filter(models.Servicio.id == sid).first()
    if not s or s.mecanico_id != mec_id:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    db.delete(s)
    db.commit()
    return {"message": "Servicio eliminado"}
