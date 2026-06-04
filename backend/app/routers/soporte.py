"""Endpoints del rol Soporte.

El soporte está por debajo del administrador en la jerarquía:
    admin > soporte > (mecanico, cliente)

Por seguridad, el soporte **NUNCA** puede:
    - Crear, editar, eliminar, suspender ni resetear la contraseña de un admin.
    - Tocar a otros usuarios soporte (solo lectura).
    - Eliminar usuarios (lo hace el admin).
    - Cambiar el rol de un usuario.

Sí puede:
    - Crear cuentas tipo cliente o mecánico.
    - Resetear contraseñas de clientes y mecánicos.
    - Activar / desactivar cuentas cliente y mecánico.
    - Eliminar reseñas inapropiadas hacia mecánicos.
    - Ver dashboard con métricas de soporte.
"""
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, selectinload

from ..auth import hash_password
from ..database import get_db
from ..deps import require_role
from .. import models, schemas

router = APIRouter(
    prefix="/api/soporte",
    tags=["soporte"],
    dependencies=[Depends(require_role("soporte"))],
)

# Roles que el soporte puede gestionar
ROLES_GESTIONABLES = {"cliente", "mecanico"}


def _exigir_no_admin(user: models.Usuario) -> None:
    """Bloquea cualquier acción de soporte sobre admins (o sobre otros soportes)."""
    if user.rol.value in {"admin", "soporte"}:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para realizar esta acción sobre este usuario",
        )


# ---------- DASHBOARD ----------

@router.get("/dashboard", response_model=schemas.SoporteDashboardOut)
def dashboard(db: Session = Depends(get_db)):
    hace_7d = datetime.utcnow() - timedelta(days=7)
    return {
        "total_clientes": db.query(models.Usuario)
        .filter(models.Usuario.rol == models.Rol.cliente)
        .count(),
        "total_mecanicos": db.query(models.Usuario)
        .filter(models.Usuario.rol == models.Rol.mecanico)
        .count(),
        "total_resenas": db.query(models.Resena).count(),
        "resenas_recientes": db.query(models.Resena)
        .filter(models.Resena.fecha >= hace_7d)
        .count(),
    }


# ---------- USUARIOS ----------

@router.get("/usuarios", response_model=list[schemas.UsuarioOut])
def listar_usuarios(
    q: Optional[str] = Query(default=None),
    rol: Optional[str] = Query(default=None),
    activo: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Lista solo clientes y mecánicos (jamás admins/soporte)."""
    query = db.query(models.Usuario).filter(
        models.Usuario.rol.in_([models.Rol.cliente, models.Rol.mecanico])
    )

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Usuario.nombre.ilike(like),
                models.Usuario.email.ilike(like),
                models.Usuario.telefono.ilike(like),
            )
        )

    if rol and rol in ROLES_GESTIONABLES:
        query = query.filter(models.Usuario.rol == models.Rol(rol))

    if activo is not None:
        query = query.filter(models.Usuario.activo == activo)

    return query.order_by(models.Usuario.fecha_registro.desc()).all()


@router.post("/usuarios", response_model=schemas.UsuarioOut, status_code=201)
def crear_usuario(
    data: schemas.SoporteUsuarioCreate,
    db: Session = Depends(get_db),
):
    if data.rol not in ROLES_GESTIONABLES:
        raise HTTPException(
            status_code=403,
            detail="Soporte solo puede crear usuarios de tipo cliente o mecánico",
        )
    if len(data.password) < 6:
        raise HTTPException(
            status_code=400, detail="La contraseña debe tener al menos 6 caracteres"
        )
    if db.query(models.Usuario).filter(models.Usuario.email == data.email).first():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo")

    user = models.Usuario(
        nombre=data.nombre,
        email=data.email,
        password=hash_password(data.password),
        telefono=data.telefono,
        rol=models.Rol(data.rol),
        activo=data.activo if data.activo is not None else True,
    )
    db.add(user)
    db.flush()

    if data.rol == "mecanico":
        mec = models.Mecanico(usuario_id=user.id, aprobado=False)
        db.add(mec)

    db.commit()
    db.refresh(user)
    return user


@router.put("/usuarios/{uid}", response_model=schemas.UsuarioOut)
def editar_usuario(
    uid: int,
    data: schemas.SoporteUsuarioUpdate,
    db: Session = Depends(get_db),
):
    """Soporte solo puede ajustar nombre, teléfono y estado de clientes/mecánicos."""
    user = db.query(models.Usuario).filter(models.Usuario.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    _exigir_no_admin(user)

    if data.nombre is not None:
        user.nombre = data.nombre
    if data.telefono is not None:
        user.telefono = data.telefono
    if data.activo is not None:
        user.activo = data.activo

    db.commit()
    db.refresh(user)
    return user


@router.put("/usuarios/{uid}/estado", response_model=schemas.UsuarioOut)
def cambiar_estado(
    uid: int,
    data: schemas.CambiarEstadoUsuarioIn,
    db: Session = Depends(get_db),
):
    user = db.query(models.Usuario).filter(models.Usuario.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    _exigir_no_admin(user)

    user.activo = data.activo
    db.commit()
    db.refresh(user)
    return user


@router.post("/usuarios/{uid}/reset-password", status_code=200)
def reset_password(
    uid: int,
    data: schemas.SoporteResetPassword,
    db: Session = Depends(get_db),
):
    """Resetea la contraseña de un cliente o mecánico (soporte ayuda al usuario)."""
    if len(data.password) < 6:
        raise HTTPException(
            status_code=400, detail="La contraseña debe tener al menos 6 caracteres"
        )
    user = db.query(models.Usuario).filter(models.Usuario.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    _exigir_no_admin(user)

    user.password = hash_password(data.password)
    db.commit()
    return {"ok": True, "mensaje": f"Contraseña actualizada para {user.email}"}


# ---------- RESEÑAS ----------

@router.get("/resenas", response_model=list[schemas.ResenaConMecanico])
def listar_resenas(
    q: Optional[str] = Query(default=None),
    mecanico_id: Optional[int] = Query(default=None, alias="mecanicoId"),
    db: Session = Depends(get_db),
):
    """Listado de reseñas para moderación. Permite filtrar por mecánico o por
    texto del comentario.
    """
    query = db.query(models.Resena).options(
        selectinload(models.Resena.cliente),
        selectinload(models.Resena.mecanico).selectinload(models.Mecanico.usuario),
    )

    if q:
        like = f"%{q}%"
        query = query.filter(models.Resena.comentario.ilike(like))

    if mecanico_id:
        query = query.filter(models.Resena.mecanico_id == mecanico_id)

    return query.order_by(models.Resena.fecha.desc()).limit(200).all()


@router.delete("/resenas/{rid}", status_code=200)
def eliminar_resena(rid: int, db: Session = Depends(get_db)):
    resena = db.query(models.Resena).filter(models.Resena.id == rid).first()
    if not resena:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    mec_id = resena.mecanico_id
    db.delete(resena)
    db.flush()

    avg = (
        db.query(func.avg(models.Resena.calificacion))
        .filter(models.Resena.mecanico_id == mec_id)
        .scalar()
    )
    mec = db.query(models.Mecanico).filter(models.Mecanico.id == mec_id).first()
    if mec:
        mec.calificacion_promedio = float(avg or 0)
    db.commit()
    return {"ok": True}


# ---------- MECÁNICOS (solo lectura) ----------

@router.get("/mecanicos", response_model=list[schemas.MecanicoAdmin])
def listar_mecanicos(db: Session = Depends(get_db)):
    """Vista de mecánicos para que soporte pueda asistir y referenciar IDs."""
    return (
        db.query(models.Mecanico)
        .options(selectinload(models.Mecanico.usuario))
        .order_by(models.Mecanico.id.desc())
        .all()
    )
