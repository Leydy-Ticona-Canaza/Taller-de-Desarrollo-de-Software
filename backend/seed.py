"""Seed inicial de la base de datos MecanicGo."""
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password


def main():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Creando usuarios...")
        pwd = hash_password("123456")

        admin = models.Usuario(
            nombre="Administrador",
            email="admin@mecanicgo.com",
            password=pwd,
            telefono="555-0000",
            rol=models.Rol.admin,
        )
        cliente = models.Usuario(
            nombre="Juan López",
            email="cliente@demo.com",
            password=pwd,
            telefono="555-1111",
            rol=models.Rol.cliente,
        )
        u_mec1 = models.Usuario(
            nombre="Carlos Pérez",
            email="mecanico@demo.com",
            password=pwd,
            telefono="555-2222",
            rol=models.Rol.mecanico,
        )
        u_mec2 = models.Usuario(
            nombre="Ana García",
            email="mecanico2@demo.com",
            password=pwd,
            telefono="555-3333",
            rol=models.Rol.mecanico,
        )
        db.add_all([admin, cliente, u_mec1, u_mec2])
        db.flush()

        print("Creando perfiles de mecánicos...")
        mec1 = models.Mecanico(
            usuario_id=u_mec1.id,
            especialidades="Frenos, Motor, Suspensión, Eléctrico",
            descripcion="Mecánico con más de 10 años de experiencia en todo tipo de vehículos",
            experiencia="10 años",
            ubicacion="Taller Central, Av. Principal #123",
            es_movil=True,
            aprobado=True,
            calificacion_promedio=4.5,
            total_trabajos=150,
            horario_inicio="08:00",
            horario_fin="18:00",
            dias_disponibles="Lun,Mar,Mie,Jue,Vie,Sab",
        )
        mec2 = models.Mecanico(
            usuario_id=u_mec2.id,
            especialidades="Motor, Transmisión, Eléctrico",
            descripcion="Especialista en motores y transmisiones automáticas",
            experiencia="8 años",
            ubicacion="Taller Norte, Calle 45 #678",
            es_movil=False,
            aprobado=True,
            calificacion_promedio=4.2,
            total_trabajos=98,
            horario_inicio="09:00",
            horario_fin="17:00",
            dias_disponibles="Lun,Mar,Mie,Jue,Vie",
        )
        db.add_all([mec1, mec2])
        db.flush()

        print("Creando servicios...")
        servicios = [
            models.Servicio(
                mecanico_id=mec1.id,
                nombre="Cambio de aceite",
                descripcion="Cambio de aceite y filtro completo",
                precio=35.0,
                duracion_minutos=45,
                categoria="Mantenimiento",
            ),
            models.Servicio(
                mecanico_id=mec1.id,
                nombre="Alineación y balanceo",
                descripcion="Alineación computarizada y balanceo de 4 ruedas",
                precio=50.0,
                duracion_minutos=60,
                categoria="Llantas",
            ),
            models.Servicio(
                mecanico_id=mec1.id,
                nombre="Cambio de frenos",
                descripcion="Cambio de pastillas y revisión de discos",
                precio=80.0,
                duracion_minutos=90,
                categoria="Frenos",
            ),
            models.Servicio(
                mecanico_id=mec1.id,
                nombre="Diagnóstico electrónico",
                descripcion="Escaneo computarizado del vehículo",
                precio=25.0,
                duracion_minutos=30,
                categoria="Diagnóstico",
            ),
            models.Servicio(
                mecanico_id=mec1.id,
                nombre="Afinación mayor",
                descripcion="Bujías, filtros, cables y revisión general",
                precio=120.0,
                duracion_minutos=180,
                categoria="Motor",
            ),
            models.Servicio(
                mecanico_id=mec2.id,
                nombre="Reparación de motor",
                descripcion="Diagnóstico y reparación completa del motor",
                precio=250.0,
                duracion_minutos=240,
                categoria="Motor",
            ),
            models.Servicio(
                mecanico_id=mec2.id,
                nombre="Cambio de transmisión",
                descripcion="Reparación o cambio de transmisión",
                precio=350.0,
                duracion_minutos=300,
                categoria="Transmisión",
            ),
            models.Servicio(
                mecanico_id=mec2.id,
                nombre="Sistema eléctrico",
                descripcion="Revisión y reparación del sistema eléctrico",
                precio=60.0,
                duracion_minutos=90,
                categoria="Eléctrico",
            ),
        ]
        db.add_all(servicios)
        db.commit()

        print("Seed completado.")
        print("  Admin:    admin@mecanicgo.com / 123456")
        print("  Cliente:  cliente@demo.com / 123456")
        print("  Mec 1:    mecanico@demo.com / 123456")
        print("  Mec 2:    mecanico2@demo.com / 123456")
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
