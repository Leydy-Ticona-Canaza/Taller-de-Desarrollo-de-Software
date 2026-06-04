import secrets
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..auth import hash_password, verify_password, create_token
from ..email_service import enviar_codigo_registro, enviar_codigo_reset
from .. import models, schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
# Extensiones de imagen permitidas (amplio: cubre cámaras, móviles y formatos modernos)
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


def _es_imagen_valida(file: UploadFile) -> bool:
    """Acepta cualquier archivo cuyo MIME empiece con image/ y tenga extensión permitida."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        return False
    if file.content_type and not file.content_type.startswith("image/"):
        return False
    return True

ROLES_REGISTRO = {"cliente", "mecanico"}
PROPOSITOS = {"registro", "reset"}
CODIGO_TTL_MIN = 10
MAX_INTENTOS = 5


def _generar_codigo() -> str:
    # Código de 6 dígitos
    return f"{secrets.randbelow(1_000_000):06d}"


def _crear_y_enviar_codigo(
    email: str, proposito: str, db: Session, bg: BackgroundTasks
) -> None:
    # Invalidar códigos previos del mismo email+proposito
    db.query(models.CodigoVerificacion).filter(
        models.CodigoVerificacion.email == email,
        models.CodigoVerificacion.proposito == proposito,
        models.CodigoVerificacion.usado == False,
    ).update({"usado": True})

    codigo = _generar_codigo()
    expira = datetime.utcnow() + timedelta(minutes=CODIGO_TTL_MIN)
    nuevo = models.CodigoVerificacion(
        email=email,
        codigo=codigo,
        proposito=proposito,
        expira_en=expira,
    )
    db.add(nuevo)
    db.commit()

    # Enviar en background para no bloquear la respuesta
    if proposito == "registro":
        bg.add_task(enviar_codigo_registro, email, codigo)
    else:
        bg.add_task(enviar_codigo_reset, email, codigo)


def _validar_codigo(email: str, codigo: str, proposito: str, db: Session) -> models.CodigoVerificacion:
    cv = (
        db.query(models.CodigoVerificacion)
        .filter(
            models.CodigoVerificacion.email == email,
            models.CodigoVerificacion.proposito == proposito,
            models.CodigoVerificacion.usado == False,
        )
        .order_by(models.CodigoVerificacion.id.desc())
        .first()
    )
    if not cv:
        raise HTTPException(status_code=400, detail="No hay código activo. Solicita uno nuevo.")
    if cv.expira_en < datetime.utcnow():
        raise HTTPException(status_code=400, detail="El código expiró. Solicita uno nuevo.")
    if cv.intentos >= MAX_INTENTOS:
        cv.usado = True
        db.commit()
        raise HTTPException(status_code=400, detail="Demasiados intentos. Solicita un nuevo código.")
    if cv.codigo != codigo.strip():
        cv.intentos += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Código incorrecto")
    return cv


@router.post("/send-code", status_code=200)
def send_code(
    data: schemas.EnviarCodigoIn,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if data.proposito not in PROPOSITOS:
        raise HTTPException(status_code=400, detail="Propósito inválido")

    existe = db.query(models.Usuario).filter(models.Usuario.email == data.email).first()
    if data.proposito == "registro" and existe:
        raise HTTPException(status_code=409, detail="Este correo ya está registrado")
    if data.proposito == "reset" and not existe:
        # Por seguridad, también respondemos OK aunque no exista, para no filtrar correos.
        return {"ok": True, "mensaje": "Si el correo está registrado, recibirás un código."}

    try:
        _crear_y_enviar_codigo(data.email, data.proposito, db, bg)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=503, detail="No se pudo enviar el correo. Intenta nuevamente."
        )

    return {"ok": True, "mensaje": f"Código enviado a {data.email}. Revisa tu bandeja (y spam)."}


@router.post("/register", response_model=schemas.TokenOut, status_code=201)
def register(data: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter(models.Usuario.email == data.email).first():
        raise HTTPException(status_code=409, detail="El email ya está registrado")

    if not data.codigo:
        raise HTTPException(status_code=400, detail="Falta el código de verificación")

    # DNI obligatorio para todos los usuarios
    if not data.dni or not data.dni.strip():
        raise HTTPException(status_code=400, detail="El DNI es obligatorio")
    dni = data.dni.strip()
    if db.query(models.Usuario).filter(models.Usuario.dni == dni).first():
        raise HTTPException(status_code=409, detail="Ya hay una cuenta con ese DNI")

    rol = data.rol if data.rol in ROLES_REGISTRO else "cliente"

    # Si es mecánico, validamos que haya completado los datos del taller
    if rol == "mecanico":
        m = data.mecanico
        if not m or not (m.nombre_local and m.nombre_local.strip()):
            raise HTTPException(
                status_code=400,
                detail="Debes ingresar el nombre de tu local/taller",
            )
        if not (m.especialidades and m.especialidades.strip()):
            raise HTTPException(
                status_code=400,
                detail="Debes ingresar al menos una especialidad",
            )
        if not (m.ubicacion and m.ubicacion.strip()):
            raise HTTPException(
                status_code=400,
                detail="Debes ingresar la ubicación de tu local",
            )

    cv = _validar_codigo(data.email, data.codigo, "registro", db)

    user = models.Usuario(
        nombre=data.nombre,
        email=data.email,
        password=hash_password(data.password),
        telefono=data.telefono,
        dni=dni,
        rol=models.Rol(rol),
    )
    db.add(user)
    db.flush()

    if rol == "mecanico":
        m = data.mecanico
        mec = models.Mecanico(
            usuario_id=user.id,
            aprobado=False,
            nombre_local=m.nombre_local.strip(),
            especialidades=m.especialidades.strip(),
            descripcion=(m.descripcion or "").strip() or None,
            experiencia=(m.experiencia or "").strip() or None,
            ubicacion=m.ubicacion.strip(),
            latitud=m.latitud,
            longitud=m.longitud,
            es_movil=bool(m.es_movil),
        )
        db.add(mec)

    cv.usado = True
    db.commit()
    db.refresh(user)

    token = create_token({"id": user.id, "rol": user.rol.value, "email": user.email})
    return {"token": token, "usuario": user}


@router.post("/reset-password", status_code=200)
def reset_password(data: schemas.ResetPasswordIn, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Correo no registrado")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    cv = _validar_codigo(data.email, data.codigo, "reset", db)
    user.password = hash_password(data.password)
    cv.usado = True
    db.commit()
    return {"ok": True, "mensaje": "Contraseña actualizada"}


@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginInput, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == data.email).first()
    if not user or not user.activo:
        raise HTTPException(status_code=401, detail="Credenciales inválidas o cuenta inactiva")
    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_token({"id": user.id, "rol": user.rol.value, "email": user.email})
    return {"token": token, "usuario": user}


@router.get("/perfil")
def get_perfil(
    user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna el usuario con su perfil de mecánico si aplica (camelCase)."""
    base = schemas.UsuarioOut.model_validate(user).model_dump(by_alias=True)
    if user.mecanico:
        base["mecanico"] = schemas.MecanicoOut.model_validate(user.mecanico).model_dump(
            by_alias=True
        )
    else:
        base["mecanico"] = None
    return base


@router.put("/perfil", response_model=schemas.UsuarioOut)
def update_perfil(
    data: schemas.PerfilUpdate,
    user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
    if data.foto_perfil is not None:
        user.foto_perfil = data.foto_perfil
    if data.password:
        user.password = hash_password(data.password)
    db.commit()
    db.refresh(user)
    return user


@router.post("/perfil/foto", response_model=schemas.UsuarioOut)
async def subir_foto_perfil(
    file: UploadFile = File(...),
    user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cualquier usuario autenticado puede subir su foto de perfil."""
    if not _es_imagen_valida(file):
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Acepta JPG, PNG, WEBP, GIF, AVIF, BMP, TIFF, HEIC, ICO.",
        )

    contenido = await file.read()
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="La foto supera los 10 MB")
    if len(contenido) == 0:
        raise HTTPException(status_code=400, detail="Archivo vacío")

    ext = Path(file.filename or "").suffix.lower()

    # Borrar la foto anterior si existía en /uploads
    if user.foto_perfil and user.foto_perfil.startswith("/uploads/"):
        nombre_old = user.foto_perfil.rsplit("/", 1)[-1]
        ruta_old = UPLOADS_DIR / nombre_old
        try:
            if (
                ruta_old.is_file()
                and ruta_old.resolve().is_relative_to(UPLOADS_DIR.resolve())
            ):
                ruta_old.unlink(missing_ok=True)
        except Exception:
            pass

    # Guardar la nueva
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    nombre = f"avatar{user.id}_{secrets.token_hex(8)}{ext}"
    destino = UPLOADS_DIR / nombre
    destino.write_bytes(contenido)

    user.foto_perfil = f"/uploads/{nombre}"
    db.commit()
    db.refresh(user)
    return user


@router.delete("/perfil/foto", response_model=schemas.UsuarioOut)
def borrar_foto_perfil(
    user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.foto_perfil and user.foto_perfil.startswith("/uploads/"):
        nombre = user.foto_perfil.rsplit("/", 1)[-1]
        ruta = UPLOADS_DIR / nombre
        try:
            if (
                ruta.is_file()
                and ruta.resolve().is_relative_to(UPLOADS_DIR.resolve())
            ):
                ruta.unlink(missing_ok=True)
        except Exception:
            pass

    user.foto_perfil = None
    db.commit()
    db.refresh(user)
    return user
