from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from ..auth import hash_password
from ..database import get_db
from ..deps import get_current_user, require_role
from .. import models, schemas

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_role("admin"))],
)

ROLES_VALIDOS = {"cliente", "mecanico", "admin", "soporte"}


@router.get("/dashboard", response_model=schemas.AdminDashboardOut)
def dashboard(db: Session = Depends(get_db)):
    return {
        "total_usuarios": db.query(models.Usuario).count(),
        "total_mecanicos": db.query(models.Mecanico).count(),
        "total_citas": db.query(models.Cita).count(),
        "pendientes_aprobacion": db.query(models.Mecanico)
        .filter(models.Mecanico.aprobado == False)
        .count(),
    }


@router.get("/usuarios", response_model=list[schemas.UsuarioOut])
def listar_usuarios(
    q: Optional[str] = Query(default=None),
    rol: Optional[str] = Query(default=None),
    activo: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Usuario)

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Usuario.nombre.ilike(like),
                models.Usuario.email.ilike(like),
                models.Usuario.telefono.ilike(like),
            )
        )

    if rol and rol in ROLES_VALIDOS:
        query = query.filter(models.Usuario.rol == models.Rol(rol))

    if activo is not None:
        query = query.filter(models.Usuario.activo == activo)

    return query.order_by(models.Usuario.fecha_registro.desc()).all()


@router.post("/usuarios", response_model=schemas.UsuarioOut, status_code=201)
def crear_usuario(
    data: schemas.AdminUsuarioCreate,
    db: Session = Depends(get_db),
):
    if data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail="Rol inválido")
    if len(data.password) < 6:
        raise HTTPException(
            status_code=400, detail="La contraseña debe tener al menos 6 caracteres"
        )
    if db.query(models.Usuario).filter(models.Usuario.email == data.email).first():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo")

    dni = (data.dni or "").strip() or None
    if dni and db.query(models.Usuario).filter(models.Usuario.dni == dni).first():
        raise HTTPException(status_code=409, detail="Ese DNI ya está en uso")

    user = models.Usuario(
        nombre=data.nombre,
        email=data.email,
        password=hash_password(data.password),
        telefono=data.telefono,
        dni=dni,
        rol=models.Rol(data.rol),
        activo=data.activo if data.activo is not None else True,
    )
    db.add(user)
    db.flush()

    # Si es mecánico, crear su perfil
    if data.rol == "mecanico":
        mec = models.Mecanico(usuario_id=user.id, aprobado=False)
        db.add(mec)

    db.commit()
    db.refresh(user)
    return user


@router.put("/usuarios/{uid}", response_model=schemas.UsuarioOut)
def editar_usuario(
    uid: int,
    data: schemas.AdminUsuarioUpdate,
    db: Session = Depends(get_db),
):
    user = db.query(models.Usuario).filter(models.Usuario.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.email and data.email != user.email:
        if db.query(models.Usuario).filter(models.Usuario.email == data.email).first():
            raise HTTPException(status_code=409, detail="Otro usuario ya usa ese correo")
        user.email = data.email

    if data.nombre is not None:
        user.nombre = data.nombre
    if data.telefono is not None:
        user.telefono = data.telefono
    if data.dni is not None:
        dni_new = data.dni.strip() or None
        if dni_new and dni_new != user.dni:
            if db.query(models.Usuario).filter(models.Usuario.dni == dni_new).first():
                raise HTTPException(status_code=409, detail="Ese DNI ya está en uso")
        user.dni = dni_new
    if data.activo is not None:
        user.activo = data.activo
    if data.password:
        if len(data.password) < 6:
            raise HTTPException(
                status_code=400, detail="La contraseña debe tener al menos 6 caracteres"
            )
        user.password = hash_password(data.password)

    if data.rol and data.rol != user.rol.value:
        if data.rol not in ROLES_VALIDOS:
            raise HTTPException(status_code=400, detail="Rol inválido")
        nuevo = models.Rol(data.rol)
        # Si pasa de no-mecánico a mecánico, creamos su ficha
        if nuevo == models.Rol.mecanico and not user.mecanico:
            db.add(models.Mecanico(usuario_id=user.id, aprobado=False))
        user.rol = nuevo

    db.commit()
    db.refresh(user)
    return user


@router.put("/usuarios/{uid}/estado", response_model=schemas.UsuarioOut)
def cambiar_estado_usuario(
    uid: int,
    data: schemas.CambiarEstadoUsuarioIn,
    actor: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.Usuario).filter(models.Usuario.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == actor.id and data.activo is False:
        raise HTTPException(
            status_code=400, detail="No puedes desactivar tu propia cuenta"
        )
    user.activo = data.activo
    db.commit()
    db.refresh(user)
    return user


@router.delete("/usuarios/{uid}", status_code=200)
def borrar_usuario(
    uid: int,
    actor: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if uid == actor.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    user = db.query(models.Usuario).filter(models.Usuario.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.get("/mecanicos", response_model=list[schemas.MecanicoAdmin])
def listar_mecanicos(db: Session = Depends(get_db)):
    """Lista todos los mecánicos con TODA la info que llenaron al registrarse."""
    return (
        db.query(models.Mecanico)
        .options(selectinload(models.Mecanico.usuario))
        .order_by(models.Mecanico.aprobado.asc(), models.Mecanico.id.desc())
        .all()
    )


@router.put("/mecanicos/{mid}/aprobar", response_model=schemas.MecanicoAdmin)
def aprobar(mid: int, db: Session = Depends(get_db)):
    mec = (
        db.query(models.Mecanico)
        .options(selectinload(models.Mecanico.usuario))
        .filter(models.Mecanico.id == mid)
        .first()
    )
    if mec:
        mec.aprobado = True
        db.commit()
        db.refresh(mec)
    return mec


@router.put("/mecanicos/{mid}/suspender", response_model=schemas.MecanicoAdmin)
def suspender(mid: int, db: Session = Depends(get_db)):
    mec = (
        db.query(models.Mecanico)
        .options(selectinload(models.Mecanico.usuario))
        .filter(models.Mecanico.id == mid)
        .first()
    )
    if mec:
        mec.aprobado = False
        db.commit()
        db.refresh(mec)
    return mec
