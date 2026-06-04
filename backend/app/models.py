import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from .database import Base


class Rol(str, enum.Enum):
    cliente = "cliente"
    mecanico = "mecanico"
    admin = "admin"
    soporte = "soporte"


class EstadoCita(str, enum.Enum):
    pendiente = "pendiente"
    aceptada = "aceptada"
    en_proceso = "en_proceso"
    finalizada = "finalizada"
    cancelada = "cancelada"
    rechazada = "rechazada"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    dni = Column(String, unique=True, nullable=True, index=True)
    rol = Column(SAEnum(Rol, name="rol"), default=Rol.cliente, nullable=False)
    foto_perfil = Column("fotoPerfil", String, nullable=True)
    fecha_registro = Column(
        "fechaRegistro", DateTime, default=datetime.utcnow, nullable=False
    )
    activo = Column(Boolean, default=True, nullable=False)

    mecanico = relationship(
        "Mecanico", back_populates="usuario", uselist=False, cascade="all, delete"
    )
    citas_cliente = relationship(
        "Cita", back_populates="cliente", foreign_keys="Cita.cliente_id"
    )
    resenas = relationship("Resena", back_populates="cliente", cascade="all, delete")


class Mecanico(Base):
    __tablename__ = "mecanicos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(
        "usuarioId",
        Integer,
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    nombre_local = Column("nombreLocal", String, nullable=True)
    especialidades = Column(String, nullable=True)
    descripcion = Column(String, nullable=True)
    experiencia = Column(String, nullable=True)
    ubicacion = Column(String, nullable=True)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    es_movil = Column("esMovil", Boolean, default=False, nullable=False)
    aprobado = Column(Boolean, default=False, nullable=False)
    calificacion_promedio = Column(
        "calificacionPromedio", Float, default=0.0, nullable=False
    )
    total_trabajos = Column("totalTrabajos", Integer, default=0, nullable=False)
    horario_inicio = Column("horarioInicio", String, default="08:00", nullable=True)
    horario_fin = Column("horarioFin", String, default="18:00", nullable=True)
    dias_disponibles = Column(
        "diasDisponibles", String, default="Lun,Mar,Mie,Jue,Vie", nullable=True
    )
    fotos_referencia = Column("fotosReferencia", String, nullable=True)

    usuario = relationship("Usuario", back_populates="mecanico")
    servicios = relationship(
        "Servicio", back_populates="mecanico", cascade="all, delete"
    )
    citas = relationship("Cita", back_populates="mecanico", cascade="all, delete")
    resenas = relationship("Resena", back_populates="mecanico", cascade="all, delete")


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mecanico_id = Column(
        "mecanicoId",
        Integer,
        ForeignKey("mecanicos.id", ondelete="CASCADE"),
        nullable=False,
    )
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    precio = Column(Float, nullable=False)
    duracion_minutos = Column("duracionMinutos", Integer, default=60, nullable=False)
    categoria = Column(String, default="General", nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    mecanico = relationship("Mecanico", back_populates="servicios")
    citas = relationship("Cita", back_populates="servicio", cascade="all, delete")


class Cita(Base):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(
        "clienteId",
        Integer,
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    mecanico_id = Column(
        "mecanicoId",
        Integer,
        ForeignKey("mecanicos.id", ondelete="CASCADE"),
        nullable=False,
    )
    servicio_id = Column(
        "servicioId",
        Integer,
        ForeignKey("servicios.id", ondelete="SET NULL"),
        nullable=True,
    )
    fecha = Column(String, nullable=False)
    hora = Column(String, nullable=False)
    descripcion_problema = Column("descripcionProblema", String, nullable=True)
    foto_problema = Column("fotoProblema", String, nullable=True)
    estado = Column(
        SAEnum(EstadoCita, name="estado_cita"),
        default=EstadoCita.pendiente,
        nullable=False,
    )
    nombre_servicio = Column("nombreServicio", String, nullable=True)
    precio_servicio = Column("precioServicio", Float, nullable=True)
    fecha_creacion = Column(
        "fechaCreacion", DateTime, default=datetime.utcnow, nullable=False
    )

    cliente = relationship(
        "Usuario", back_populates="citas_cliente", foreign_keys=[cliente_id]
    )
    mecanico = relationship("Mecanico", back_populates="citas")
    servicio = relationship("Servicio", back_populates="citas")
    resena = relationship(
        "Resena", back_populates="cita", uselist=False, cascade="all, delete"
    )


class CodigoVerificacion(Base):
    __tablename__ = "codigos_verificacion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, nullable=False, index=True)
    codigo = Column(String, nullable=False)
    proposito = Column(String, nullable=False)  # "registro" | "reset"
    expira_en = Column("expiraEn", DateTime, nullable=False)
    usado = Column(Boolean, default=False, nullable=False)
    intentos = Column(Integer, default=0, nullable=False)
    creado_en = Column("creadoEn", DateTime, default=datetime.utcnow, nullable=False)


class Resena(Base):
    __tablename__ = "resenas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cita_id = Column(
        "citaId",
        Integer,
        ForeignKey("citas.id", ondelete="CASCADE"),
        unique=True,
        nullable=True,
    )
    cliente_id = Column(
        "clienteId",
        Integer,
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    mecanico_id = Column(
        "mecanicoId",
        Integer,
        ForeignKey("mecanicos.id", ondelete="CASCADE"),
        nullable=False,
    )
    calificacion = Column(Integer, nullable=False)
    comentario = Column(String, nullable=True)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)

    cita = relationship("Cita", back_populates="resena")
    cliente = relationship("Usuario", back_populates="resenas")
    mecanico = relationship("Mecanico", back_populates="resenas")
