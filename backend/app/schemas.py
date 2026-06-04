from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from pydantic.alias_generators import to_camel


def CamelModel():
    """Genera la config para que las respuestas usen camelCase."""
    return ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )


# ---------- USUARIO ----------

class UsuarioBase(BaseModel):
    model_config = CamelModel()

    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    dni: Optional[str] = None
    rol: str = "cliente"


class MecanicoRegistroData(BaseModel):
    """Datos extra que el mecánico llena al registrarse para enviar al admin."""
    model_config = CamelModel()

    nombre_local: Optional[str] = None
    especialidades: Optional[str] = None
    descripcion: Optional[str] = None
    experiencia: Optional[str] = None
    ubicacion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    es_movil: Optional[bool] = False


class UsuarioCreate(BaseModel):
    model_config = CamelModel()

    nombre: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    dni: Optional[str] = None
    rol: Optional[str] = "cliente"
    codigo: Optional[str] = None
    # Solo cuando rol == "mecanico"
    mecanico: Optional[MecanicoRegistroData] = None


class EnviarCodigoIn(BaseModel):
    model_config = CamelModel()

    email: EmailStr
    proposito: str  # "registro" | "reset"


class ResetPasswordIn(BaseModel):
    model_config = CamelModel()

    email: EmailStr
    codigo: str
    password: str


class AdminUsuarioCreate(BaseModel):
    model_config = CamelModel()

    nombre: str
    email: EmailStr
    password: str
    rol: str
    telefono: Optional[str] = None
    dni: Optional[str] = None
    activo: Optional[bool] = True


class AdminUsuarioUpdate(BaseModel):
    model_config = CamelModel()

    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[str] = None
    telefono: Optional[str] = None
    dni: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None


class UsuarioOut(BaseModel):
    model_config = CamelModel()

    id: int
    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    dni: Optional[str] = None
    rol: str
    foto_perfil: Optional[str] = None
    fecha_registro: datetime
    activo: bool


class UsuarioMini(BaseModel):
    model_config = CamelModel()

    id: int
    nombre: str
    foto_perfil: Optional[str] = None


class UsuarioMiniContacto(BaseModel):
    model_config = CamelModel()

    id: int
    nombre: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    dni: Optional[str] = None
    foto_perfil: Optional[str] = None


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    model_config = CamelModel()

    token: str
    usuario: UsuarioOut


class PerfilUpdate(BaseModel):
    model_config = CamelModel()

    nombre: Optional[str] = None
    telefono: Optional[str] = None
    dni: Optional[str] = None
    foto_perfil: Optional[str] = None
    password: Optional[str] = None


# ---------- SERVICIO ----------

class ServicioBase(BaseModel):
    model_config = CamelModel()

    nombre: str
    descripcion: Optional[str] = None
    precio: float
    duracion_minutos: int = 60
    categoria: str = "General"


class ServicioCreate(ServicioBase):
    pass


class ServicioUpdate(BaseModel):
    model_config = CamelModel()

    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    duracion_minutos: Optional[int] = None
    categoria: Optional[str] = None
    activo: Optional[bool] = None


class ServicioOut(BaseModel):
    model_config = CamelModel()

    id: int
    mecanico_id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    duracion_minutos: int
    categoria: str
    activo: bool


# ---------- MECANICO ----------

class MecanicoUpdate(BaseModel):
    model_config = CamelModel()

    nombre_local: Optional[str] = None
    especialidades: Optional[str] = None
    descripcion: Optional[str] = None
    experiencia: Optional[str] = None
    ubicacion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    es_movil: Optional[bool] = None
    horario_inicio: Optional[str] = None
    horario_fin: Optional[str] = None
    dias_disponibles: Optional[str] = None
    fotos_referencia: Optional[str] = None


class ResenaOut(BaseModel):
    model_config = CamelModel()

    id: int
    cita_id: Optional[int] = None
    cliente_id: int
    mecanico_id: int
    calificacion: int
    comentario: Optional[str] = None
    fecha: datetime
    cliente: Optional[UsuarioMini] = None


class MecanicoOut(BaseModel):
    model_config = CamelModel()

    id: int
    usuario_id: int
    nombre_local: Optional[str] = None
    especialidades: Optional[str] = None
    descripcion: Optional[str] = None
    experiencia: Optional[str] = None
    ubicacion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    es_movil: bool
    aprobado: bool
    calificacion_promedio: float
    total_trabajos: int
    horario_inicio: Optional[str] = None
    horario_fin: Optional[str] = None
    dias_disponibles: Optional[str] = None
    fotos_referencia: Optional[str] = None
    usuario: Optional[UsuarioMiniContacto] = None
    servicios: List[ServicioOut] = []
    resenas: List[ResenaOut] = []


class MecanicoCard(BaseModel):
    model_config = CamelModel()

    id: int
    usuario_id: int
    nombre_local: Optional[str] = None
    especialidades: Optional[str] = None
    descripcion: Optional[str] = None
    ubicacion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    es_movil: bool
    aprobado: bool
    calificacion_promedio: float
    total_trabajos: int
    fotos_referencia: Optional[str] = None
    usuario: Optional[UsuarioMini] = None
    servicios: List[ServicioOut] = []


class MecanicoAdmin(BaseModel):
    """Para la página de aprobación: incluye TODO lo que el mecánico llenó al registrarse."""
    model_config = CamelModel()

    id: int
    usuario_id: int
    nombre_local: Optional[str] = None
    especialidades: Optional[str] = None
    descripcion: Optional[str] = None
    experiencia: Optional[str] = None
    ubicacion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    es_movil: bool
    aprobado: bool
    calificacion_promedio: float
    total_trabajos: int
    horario_inicio: Optional[str] = None
    horario_fin: Optional[str] = None
    dias_disponibles: Optional[str] = None
    fotos_referencia: Optional[str] = None
    usuario: Optional[UsuarioOut] = None


class DashboardMecanicoOut(BaseModel):
    model_config = CamelModel()

    citas_pendientes: int
    citas_aceptadas: int
    citas_finalizadas: int
    total_citas: int
    calificacion_promedio: float
    total_trabajos: int
    aprobado: bool


# ---------- CITA ----------

class CitaCreate(BaseModel):
    model_config = CamelModel()

    mecanico_id: int
    servicio_id: Optional[int] = None  # opcional: si el taller no tiene servicios publicados
    fecha: str
    hora: str
    descripcion_problema: Optional[str] = None
    foto_problema: Optional[str] = None


class CambiarEstadoIn(BaseModel):
    estado: str


class CitaOut(BaseModel):
    model_config = CamelModel()

    id: int
    cliente_id: int
    mecanico_id: int
    servicio_id: Optional[int] = None
    fecha: str
    hora: str
    descripcion_problema: Optional[str] = None
    foto_problema: Optional[str] = None
    estado: str
    nombre_servicio: Optional[str] = None
    precio_servicio: Optional[float] = None
    fecha_creacion: datetime
    servicio: Optional[ServicioOut] = None
    mecanico: Optional["MecanicoCard"] = None
    cliente: Optional[UsuarioMiniContacto] = None
    resena: Optional[ResenaOut] = None


# ---------- RESENA ----------

class ResenaCreate(BaseModel):
    model_config = CamelModel()

    cita_id: Optional[int] = None
    mecanico_id: Optional[int] = None
    calificacion: int
    comentario: Optional[str] = None


class ResenaConMecanico(BaseModel):
    model_config = CamelModel()

    id: int
    cita_id: Optional[int] = None
    cliente_id: int
    mecanico_id: int
    calificacion: int
    comentario: Optional[str] = None
    fecha: datetime
    cliente: Optional[UsuarioMini] = None
    mecanico: Optional["MecanicoCard"] = None


# ---------- ADMIN ----------

class AdminDashboardOut(BaseModel):
    model_config = CamelModel()

    total_usuarios: int
    total_mecanicos: int
    total_citas: int
    pendientes_aprobacion: int


class CambiarEstadoUsuarioIn(BaseModel):
    activo: bool


# ---------- SOPORTE ----------

class SoporteUsuarioCreate(BaseModel):
    model_config = CamelModel()

    nombre: str
    email: EmailStr
    password: str
    rol: str  # "cliente" | "mecanico" únicamente
    telefono: Optional[str] = None
    dni: Optional[str] = None
    activo: Optional[bool] = True


class SoporteUsuarioUpdate(BaseModel):
    model_config = CamelModel()

    nombre: Optional[str] = None
    telefono: Optional[str] = None
    dni: Optional[str] = None
    activo: Optional[bool] = None


class SoporteResetPassword(BaseModel):
    model_config = CamelModel()

    password: str


class SoporteDashboardOut(BaseModel):
    model_config = CamelModel()

    total_clientes: int
    total_mecanicos: int
    total_resenas: int
    resenas_recientes: int


CitaOut.model_rebuild()
ResenaConMecanico.model_rebuild()
