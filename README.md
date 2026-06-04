# MecanicGo Web

Plataforma web de reserva de servicios mecánicos. Conecta clientes con mecánicos independientes.

## Stack

- **Frontend:** React 18 + Vite + TailwindCSS + React Router + Axios + React Query + React Hot Toast
- **Backend:** Python 3.12 + FastAPI + SQLAlchemy + Pydantic + JWT (python-jose) + bcrypt
- **Base de datos:** PostgreSQL 16+

## Instalación

### 1. Crear la base de datos

Asegúrate de tener PostgreSQL corriendo. La contraseña del usuario `postgres` debe ser `123456`.

Importa el dump incluido `mecanicgo_db.sql`:

```powershell
$env:PGPASSWORD = "123456"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE mecanicgo_db;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d mecanicgo_db -f mecanicgo_db.sql
```

(O usa el `seed.py` que recrea las tablas y los datos demo.)

### 2. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 4000
```

API en `http://localhost:4000` — docs interactivas en `http://localhost:4000/docs`.

### 3. Frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Aplicación en `http://localhost:5173`.

Para compilar el frontend para producción:

```powershell
npm run build
npm run preview
```

## Credenciales de prueba

| Rol      | Email                  | Contraseña |
| -------- | ---------------------- | ---------- |
| Admin    | admin@mecanicgo.com    | 123456     |
| Mecánico | mecanico@demo.com      | 123456     |
| Mecánico | mecanico2@demo.com     | 123456     |
| Cliente  | cliente@demo.com       | 123456     |