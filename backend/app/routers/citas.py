from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import require_role
from .. import models, schemas

router = APIRouter(prefix="/api/citas", tags=["citas"])

ESTADOS_VALIDOS = {e.value for e in models.EstadoCita}

# Estados que ocupan un slot (es decir, hacen que esa hora no esté disponible)
ESTADOS_OCUPADOS = {
    models.EstadoCita.pendiente,
    models.EstadoCita.aceptada,
    models.EstadoCita.en_proceso,
}


@router.get("/ocupadas/{mecanico_id}")
def horarios_ocupados(
    mecanico_id: int,
    fecha: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """Devuelve las horas (strings 'HH:MM') que están ocupadas en ese mecánico/fecha.

    Público: cualquier cliente puede consultar la disponibilidad antes de reservar.
    Solo se cuentan citas en estado pendiente / aceptada / en_proceso (las canceladas,
    rechazadas o finalizadas liberan el slot).
    """
    citas = (
        db.query(models.Cita)
        .filter(
            models.Cita.mecanico_id == mecanico_id,
            models.Cita.fecha == fecha,
            models.Cita.estado.in_(ESTADOS_OCUPADOS),
        )
        .all()
    )
    return {
        "mecanicoId": mecanico_id,
        "fecha": fecha,
        "horasOcupadas": [c.hora for c in citas if c.hora],
    }


@router.post("", status_code=201)
def crear(
    data: schemas.CitaCreate,
    user: models.Usuario = Depends(require_role("cliente")),
    db: Session = Depends(get_db),
):
    # Validar que el mecánico exista
    mec = db.query(models.Mecanico).filter(models.Mecanico.id == data.mecanico_id).first()
    if not mec:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")

    nombre_servicio = "Consulta general"
    precio_servicio = None
    if data.servicio_id is not None:
        servicio = (
            db.query(models.Servicio)
            .filter(models.Servicio.id == data.servicio_id)
            .first()
        )
        if not servicio:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        nombre_servicio = servicio.nombre
        precio_servicio = servicio.precio

    cita = models.Cita(
        cliente_id=user.id,
        mecanico_id=data.mecanico_id,
        servicio_id=data.servicio_id,
        fecha=data.fecha,
        hora=data.hora,
        descripcion_problema=data.descripcion_problema,
        foto_problema=data.foto_problema,
        nombre_servicio=nombre_servicio,
        precio_servicio=precio_servicio,
    )
    db.add(cita)
    db.commit()
    db.refresh(cita)
    cita = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.servicio),
            selectinload(models.Cita.mecanico).selectinload(models.Mecanico.usuario),
        )
        .filter(models.Cita.id == cita.id)
        .first()
    )
    return _cita_response(cita)


@router.get("/mis-citas")
def mis_citas(
    user: models.Usuario = Depends(require_role("cliente")),
    db: Session = Depends(get_db),
):
    citas = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.servicio),
            selectinload(models.Cita.mecanico).selectinload(models.Mecanico.usuario),
            selectinload(models.Cita.resena),
        )
        .filter(models.Cita.cliente_id == user.id)
        .order_by(models.Cita.fecha_creacion.desc())
        .all()
    )
    return [_cita_response(c) for c in citas]


@router.get("/mecanico")
def citas_mecanico(
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    mec = db.query(models.Mecanico).filter(models.Mecanico.usuario_id == user.id).first()
    if not mec:
        raise HTTPException(status_code=404, detail="Perfil de mecánico no encontrado")
    citas = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.servicio),
            selectinload(models.Cita.cliente),
        )
        .filter(models.Cita.mecanico_id == mec.id)
        .order_by(models.Cita.fecha_creacion.desc())
        .all()
    )
    return [_cita_response(c, perspective="mecanico") for c in citas]


@router.put("/{cid}/estado")
def cambiar_estado(
    cid: int,
    data: schemas.CambiarEstadoIn,
    user: models.Usuario = Depends(require_role("mecanico")),
    db: Session = Depends(get_db),
):
    if data.estado not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Estado inválido")
    mec = db.query(models.Mecanico).filter(models.Mecanico.usuario_id == user.id).first()
    cita = db.query(models.Cita).filter(models.Cita.id == cid).first()
    if not cita or not mec or cita.mecanico_id != mec.id:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    cita.estado = models.EstadoCita(data.estado)

    if data.estado == "finalizada":
        mec.total_trabajos = (mec.total_trabajos or 0) + 1
    db.commit()
    db.refresh(cita)
    return _cita_response(cita)


@router.put("/{cid}/cancelar")
def cancelar(
    cid: int,
    user: models.Usuario = Depends(require_role("cliente")),
    db: Session = Depends(get_db),
):
    cita = db.query(models.Cita).filter(models.Cita.id == cid).first()
    if not cita or cita.cliente_id != user.id:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.estado not in (models.EstadoCita.pendiente, models.EstadoCita.aceptada):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden cancelar citas pendientes o aceptadas",
        )
    cita.estado = models.EstadoCita.cancelada
    db.commit()
    db.refresh(cita)
    return _cita_response(cita)


def _cita_response(c: models.Cita, perspective: str = "cliente") -> dict:
    base = {
        "id": c.id,
        "clienteId": c.cliente_id,
        "mecanicoId": c.mecanico_id,
        "servicioId": c.servicio_id,
        "fecha": c.fecha,
        "hora": c.hora,
        "descripcionProblema": c.descripcion_problema,
        "fotoProblema": c.foto_problema,
        "estado": c.estado.value,
        "nombreServicio": c.nombre_servicio,
        "precioServicio": c.precio_servicio,
        "fechaCreacion": c.fecha_creacion.isoformat() if c.fecha_creacion else None,
    }
    if c.servicio:
        base["servicio"] = {
            "id": c.servicio.id,
            "mecanicoId": c.servicio.mecanico_id,
            "nombre": c.servicio.nombre,
            "descripcion": c.servicio.descripcion,
            "precio": c.servicio.precio,
            "duracionMinutos": c.servicio.duracion_minutos,
            "categoria": c.servicio.categoria,
            "activo": c.servicio.activo,
        }
    if perspective == "cliente" and c.mecanico:
        base["mecanico"] = {
            "id": c.mecanico.id,
            "usuario": (
                {
                    "id": c.mecanico.usuario.id,
                    "nombre": c.mecanico.usuario.nombre,
                    "fotoPerfil": c.mecanico.usuario.foto_perfil,
                }
                if c.mecanico.usuario
                else None
            ),
        }
        if c.resena:
            base["resena"] = {
                "id": c.resena.id,
                "calificacion": c.resena.calificacion,
                "comentario": c.resena.comentario,
            }
    if perspective == "mecanico" and c.cliente:
        base["cliente"] = {
            "id": c.cliente.id,
            "nombre": c.cliente.nombre,
            "email": c.cliente.email,
            "telefono": c.cliente.telefono,
            "fotoPerfil": c.cliente.foto_perfil,
        }
    return base
