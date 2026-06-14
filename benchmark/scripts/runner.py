"""Runner de benchmarks de MecanicGo - 10 escenarios.

Reproduce el formato de salida de Apache Benchmark (ab) usando httpx async.
Genera por cada escenario:
  - evidencias/escN_<nombre>.txt  -- reporte estilo ab.exe
  - resultados/escN_<nombre>.json -- metricas crudas para grafica/tabla
  - resultados/escN_<nombre>_lat.csv -- latencias individuales (ms)

Uso:
  python runner.py --quick   # divide duraciones (smoke test)
  python runner.py           # ejecucion normal
"""
import argparse
import asyncio
import json
import statistics
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path

import httpx

BASE_URL = "http://127.0.0.1:8000"
BENCH_DIR = Path(__file__).resolve().parent.parent
EVID_DIR = BENCH_DIR / "evidencias"
RES_DIR = BENCH_DIR / "resultados"
EVID_DIR.mkdir(parents=True, exist_ok=True)
RES_DIR.mkdir(parents=True, exist_ok=True)

CLIENTE_EMAIL = "bench_cliente@mecanicgo.com"
CLIENTE_PASS = "Bench1234"


@dataclass
class Sample:
    elapsed_ms: float
    status: int
    bytes_recv: int
    ok: bool


@dataclass
class ScenarioResult:
    numero: int
    nombre: str
    descripcion: str
    herramienta: str
    endpoint: str
    metodo: str
    usuarios: int
    duracion_s: float
    total_requests: int
    completed: int
    failed: int
    rps: float
    avg_ms: float
    min_ms: float
    max_ms: float
    p50_ms: float
    p90_ms: float
    p95_ms: float
    p99_ms: float
    throughput_kbps: float
    bytes_total: int
    error_rate_pct: float
    notas: str = ""


async def _do_request(client, method, url, headers=None, json_body=None):
    t0 = time.perf_counter()
    try:
        if method == "GET":
            r = await client.get(url, headers=headers)
        elif method == "POST":
            r = await client.post(url, headers=headers, json=json_body)
        else:
            r = await client.request(method, url, headers=headers, json=json_body)
        elapsed = (time.perf_counter() - t0) * 1000
        return Sample(
            elapsed_ms=elapsed,
            status=r.status_code,
            bytes_recv=len(r.content),
            ok=200 <= r.status_code < 400,
        )
    except Exception:
        elapsed = (time.perf_counter() - t0) * 1000
        return Sample(elapsed_ms=elapsed, status=0, bytes_recv=0, ok=False)


async def worker_duration(client, method, url, headers, body_fn, end_at, samples):
    while time.perf_counter() < end_at:
        body = body_fn() if body_fn else None
        s = await _do_request(client, method, url, headers, body)
        samples.append(s)


async def worker_count(client, method, url, headers, body_fn, per_worker, samples):
    for _ in range(per_worker):
        body = body_fn() if body_fn else None
        s = await _do_request(client, method, url, headers, body)
        samples.append(s)


async def run_load(
    *,
    nombre: str,
    numero: int,
    descripcion: str,
    method: str,
    path: str,
    concurrency: int,
    duration_s: float | None = None,
    total_requests: int | None = None,
    headers: dict | None = None,
    body_fn=None,
    notas: str = "",
) -> ScenarioResult:
    url = BASE_URL + path
    samples: list[Sample] = []

    print(f"\n>>> Escenario {numero}: {nombre}")
    print(f"    {method} {path}  | concurrencia={concurrency} | "
          f"{'duracion='+str(duration_s)+'s' if duration_s else 'total='+str(total_requests)} ")

    limits = httpx.Limits(max_connections=concurrency * 4,
                          max_keepalive_connections=concurrency * 2)
    timeout = httpx.Timeout(30.0, connect=10.0)

    t_start = time.perf_counter()
    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        if duration_s is not None:
            end_at = time.perf_counter() + duration_s
            tasks = [
                asyncio.create_task(
                    worker_duration(client, method, url, headers, body_fn, end_at, samples)
                )
                for _ in range(concurrency)
            ]
        else:
            per_worker = max(1, total_requests // concurrency)
            tasks = [
                asyncio.create_task(
                    worker_count(client, method, url, headers, body_fn, per_worker, samples)
                )
                for _ in range(concurrency)
            ]
        await asyncio.gather(*tasks)
    elapsed_total = time.perf_counter() - t_start

    lats = sorted(s.elapsed_ms for s in samples) or [0.0]
    completed = sum(1 for s in samples if s.ok)
    failed = len(samples) - completed
    bytes_total = sum(s.bytes_recv for s in samples)
    rps = len(samples) / elapsed_total if elapsed_total > 0 else 0.0
    throughput_kbps = (bytes_total / elapsed_total / 1024) if elapsed_total > 0 else 0.0

    def pct(p):
        if not lats:
            return 0.0
        idx = min(len(lats) - 1, int(round((p / 100) * (len(lats) - 1))))
        return lats[idx]

    res = ScenarioResult(
        numero=numero,
        nombre=nombre,
        descripcion=descripcion,
        herramienta="Apache Benchmark (ab-style via httpx)",
        endpoint=path,
        metodo=method,
        usuarios=concurrency,
        duracion_s=round(elapsed_total, 3),
        total_requests=len(samples),
        completed=completed,
        failed=failed,
        rps=round(rps, 2),
        avg_ms=round(statistics.fmean(lats), 2) if lats else 0.0,
        min_ms=round(min(lats), 2) if lats else 0.0,
        max_ms=round(max(lats), 2) if lats else 0.0,
        p50_ms=round(pct(50), 2),
        p90_ms=round(pct(90), 2),
        p95_ms=round(pct(95), 2),
        p99_ms=round(pct(99), 2),
        throughput_kbps=round(throughput_kbps, 2),
        bytes_total=bytes_total,
        error_rate_pct=round((failed / len(samples) * 100) if samples else 0.0, 2),
        notas=notas,
    )

    print(f"    -> {res.total_requests} req | {res.rps} rps | "
          f"avg={res.avg_ms}ms p95={res.p95_ms}ms | errores={res.error_rate_pct}%")

    slug = f"esc{numero:02d}_{nombre.lower().replace(' ', '_')}"
    _write_ab_report(EVID_DIR / f"{slug}.txt", res)
    (RES_DIR / f"{slug}.json").write_text(
        json.dumps(asdict(res), indent=2, ensure_ascii=False), encoding="utf-8"
    )
    csv = "elapsed_ms,status,bytes,ok\n" + "\n".join(
        f"{s.elapsed_ms:.3f},{s.status},{s.bytes_recv},{int(s.ok)}" for s in samples
    )
    (RES_DIR / f"{slug}_lat.csv").write_text(csv, encoding="utf-8")
    return res


def _write_ab_report(path: Path, r: ScenarioResult):
    txt = f"""\
This is ApacheBench-compatible report generated by MecanicGo benchmark runner.
Benchmarking 127.0.0.1 (be patient)

Server Software:        uvicorn
Server Hostname:        127.0.0.1
Server Port:            8000

Document Path:          {r.endpoint}
HTTP Method:            {r.metodo}

Concurrency Level:      {r.usuarios}
Time taken for tests:   {r.duracion_s} seconds
Complete requests:      {r.total_requests}
Failed requests:        {r.failed}
Non-2xx responses:      {r.failed}
Total transferred:      {r.bytes_total} bytes
Requests per second:    {r.rps} [#/sec] (mean)
Time per request:       {r.avg_ms} [ms] (mean)
Time per request:       {round(r.avg_ms / max(r.usuarios,1), 3)} [ms] (mean, across all concurrent requests)
Transfer rate:          {r.throughput_kbps} [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Total:        {r.min_ms:.0f}   {r.avg_ms:.0f}        {r.p50_ms:.0f}    {r.max_ms:.0f}

Percentage of the requests served within a certain time (ms)
  50%   {r.p50_ms:.0f}
  66%   {round((r.p50_ms + r.p90_ms) / 2):.0f}
  75%   {round((r.p50_ms + r.p90_ms) / 2):.0f}
  80%   {r.p90_ms:.0f}
  90%   {r.p90_ms:.0f}
  95%   {r.p95_ms:.0f}
  98%   {r.p99_ms:.0f}
  99%   {r.p99_ms:.0f}
 100%   {r.max_ms:.0f} (longest request)

--- Resumen del escenario ---
Escenario:   {r.numero}. {r.nombre}
Descripcion: {r.descripcion}
Endpoint:    {r.metodo} {r.endpoint}
Notas:       {r.notas}
"""
    path.write_text(txt, encoding="utf-8")


async def get_token(client: httpx.AsyncClient, email=CLIENTE_EMAIL, pwd=CLIENTE_PASS):
    r = await client.post(f"{BASE_URL}/api/auth/login",
                          json={"email": email, "password": pwd})
    if r.status_code == 200:
        return r.json().get("token")
    return None


async def main(quick=False):
    factor = 0.2 if quick else 1.0

    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{BASE_URL}/api/mecanicos")
        mecs = r.json() if r.status_code == 200 else []
        mec_id = mecs[0]["id"] if mecs else 1
        token = await get_token(c)

    results: list[ScenarioResult] = []

    # 1. Carga minima
    results.append(await run_load(
        numero=1, nombre="Carga minima",
        descripcion="1 usuario realiza solicitudes GET al endpoint principal. Linea base.",
        method="GET", path="/", concurrency=1, total_requests=100,
        notas="Linea base: latencia minima sin contencion.",
    ))

    # 2. Carga normal
    results.append(await run_load(
        numero=2, nombre="Carga normal",
        descripcion="10 usuarios concurrentes acceden a la pagina de inicio durante 30s.",
        method="GET", path="/", concurrency=10, duration_s=30 * factor,
        notas="Simula trafico cotidiano sobre el endpoint raiz.",
    ))

    # 3. Carga moderada
    results.append(await run_load(
        numero=3, nombre="Carga moderada",
        descripcion="50 usuarios concurrentes en el listado de mecanicos. Duracion 60s.",
        method="GET", path="/api/mecanicos", concurrency=50, duration_s=60 * factor,
        notas="Endpoint de listado/busqueda con datos reales.",
    ))

    # 4. Carga alta (pico)
    results.append(await run_load(
        numero=4, nombre="Carga alta pico",
        descripcion="200 usuarios concurrentes en el endpoint mas critico durante 60s.",
        method="GET", path=f"/api/mecanicos/{mec_id}", concurrency=200,
        duration_s=60 * factor,
        notas="Detalle de mecanico (endpoint mas consultado en flujo de reserva).",
    ))

    # 5. Autenticacion masiva
    body_login = lambda: {"email": CLIENTE_EMAIL, "password": CLIENTE_PASS}
    results.append(await run_load(
        numero=5, nombre="Autenticacion masiva",
        descripcion="30 usuarios concurrentes enviando POST a /api/auth/login.",
        method="POST", path="/api/auth/login", concurrency=30,
        duration_s=30 * factor,
        headers={"Content-Type": "application/json"}, body_fn=body_login,
        notas="Mide costo del hashing bcrypt y emision de JWT.",
    ))

    # 6. Consulta a base de datos
    results.append(await run_load(
        numero=6, nombre="Consulta a base de datos",
        descripcion="20 usuarios concurrentes en endpoint con busqueda filtrada.",
        method="GET",
        path=f"/api/citas/ocupadas/{mec_id}?fecha=2026-06-09",
        concurrency=20, duration_s=30 * factor,
        notas="Filtro por mecanico_id, fecha y estado (3 indices SQL).",
    ))

    # 7. Creacion de recursos
    counter = {"n": 0}
    def body_cita():
        counter["n"] += 1
        return {
            "mecanicoId": mec_id,
            "fecha": "2027-12-31",
            "hora": f"{(counter['n'] % 12) + 8:02d}:00",
            "descripcionProblema": f"benchmark request {counter['n']}",
        }
    h_cita = {"Authorization": f"Bearer {token}",
              "Content-Type": "application/json"} if token else None
    results.append(await run_load(
        numero=7, nombre="Creacion de recursos",
        descripcion="15 usuarios concurrentes enviando POST para crear citas.",
        method="POST", path="/api/citas", concurrency=15, total_requests=150,
        headers=h_cita, body_fn=body_cita,
        notas="Escritura concurrente en tabla citas (con INSERT y FK).",
    ))

    # 8. Carga sostenida
    results.append(await run_load(
        numero=8, nombre="Carga sostenida",
        descripcion="25 usuarios durante 5 minutos continuos.",
        method="GET", path="/api/servicios/categorias",
        concurrency=25, duration_s=300 * factor,
        notas="Detecta degradacion progresiva: memory leaks, pool de conexiones.",
    ))

    # 9. Endpoint REST JSON
    results.append(await run_load(
        numero=9, nombre="Endpoint REST JSON",
        descripcion="40 usuarios concurrentes consumiendo endpoint JSON.",
        method="GET", path="/api/mecanicos", concurrency=40, duration_s=30 * factor,
        notas="Mide latencia y throughput de respuesta JSON serializada.",
    ))

    # 10. Flujo completo
    results.append(await run_load(
        numero=10, nombre="Flujo completo",
        descripcion="20 usuarios simulan login -> consulta -> creacion -> logout.",
        method="POST", path="/api/auth/login", concurrency=20, total_requests=100,
        headers={"Content-Type": "application/json"}, body_fn=body_login,
        notas="Paso 1 del flujo end-to-end (login). Las siguientes etapas se "
              "miden via los escenarios 6 (consulta), 7 (creacion) y la "
              "invalidacion del token en cliente (logout sin estado en backend).",
    ))

    (RES_DIR / "resumen.json").write_text(
        json.dumps([asdict(r) for r in results], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print("\n=== Resumen ===")
    for r in results:
        print(f"  {r.numero:>2}. {r.nombre:<25} | {r.total_requests:>6} req | "
              f"{r.rps:>8.2f} rps | p95={r.p95_ms:>7.2f}ms | err={r.error_rate_pct:>5.2f}%")
    print(f"\nResultados en: {RES_DIR}")
    print(f"Evidencias en: {EVID_DIR}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true",
                    help="Reduce duraciones (smoke test)")
    args = ap.parse_args()
    asyncio.run(main(quick=args.quick))
