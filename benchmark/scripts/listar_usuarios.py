"""Lista los usuarios reales de la BD (id, nombre, email, rol, activo)."""
import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent / "backend"
sys.path.insert(0, str(ROOT))

from app.database import SessionLocal
from app import models


def main():
    db = SessionLocal()
    try:
        users = db.query(models.Usuario).order_by(models.Usuario.id).all()
        data = []
        for u in users:
            mec_info = None
            if u.mecanico:
                mec_info = {
                    "nombre_local": u.mecanico.nombre_local,
                    "aprobado": u.mecanico.aprobado,
                    "ubicacion": u.mecanico.ubicacion,
                    "especialidades": u.mecanico.especialidades,
                }
            data.append({
                "id": u.id,
                "nombre": u.nombre,
                "email": u.email,
                "rol": u.rol.value if u.rol else None,
                "activo": u.activo,
                "telefono": u.telefono,
                "mecanico": mec_info,
            })
        out_dir = Path(__file__).resolve().parent.parent / "resultados"
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / "usuarios_db.json"
        out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"OK -> {out} ({len(data)} usuarios)")
        for u in data:
            print(f"  id={u['id']:>3} | rol={u['rol']:<10} | "
                  f"activo={u['activo']} | {u['nombre']:<30} | {u['email']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
