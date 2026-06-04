import { useMemo, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDay,
} from "react-icons/fa";
import {
  DIAS_CORTOS_ES,
  DIAS_MIN_ES,
  MESES_ES,
  estadoMeta,
  mismoDia,
  parseFecha,
  ymd,
} from "../utils/citas";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// Devuelve la matriz 6x7 (siempre 42 celdas) que comienza el domingo
function buildGrid(refDate) {
  const first = startOfMonth(refDate);
  const offset = first.getDay(); // 0 = domingo
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export default function CalendarioCitas({
  citas = [],
  onDayClick,
  selectedDate,
}) {
  const [refDate, setRefDate] = useState(() => new Date());
  const hoy = new Date();

  // Agrupar citas por día YYYY-MM-DD
  const porDia = useMemo(() => {
    const map = {};
    for (const c of citas) {
      const key = c.fecha;
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [citas]);

  const cells = useMemo(() => buildGrid(refDate), [refDate]);

  function isOtroMes(d) {
    return d.getMonth() !== refDate.getMonth();
  }

  return (
    <div className="card p-3 sm:p-5">
      {/* Header de navegación */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={() => setRefDate(addMonths(refDate, -1))}
          className="w-9 h-9 rounded-xl bg-primary-softer text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
          title="Mes anterior"
        >
          <FaChevronLeft />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-extrabold text-base sm:text-lg text-primary-dark uppercase tracking-wider">
            {MESES_ES[refDate.getMonth()]} {refDate.getFullYear()}
          </span>
          <button
            onClick={() => setRefDate(new Date())}
            className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
          >
            <FaCalendarDay /> Hoy
          </button>
        </div>
        <button
          onClick={() => setRefDate(addMonths(refDate, 1))}
          className="w-9 h-9 rounded-xl bg-primary-softer text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
          title="Mes siguiente"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_CORTOS_ES.map((d, i) => (
          <div
            key={d}
            className="text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider py-1"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{DIAS_MIN_ES[i]}</span>
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          const key = ymd(d);
          const dCitas = porDia[key] || [];
          const cantidad = dCitas.length;
          const otroMes = isOtroMes(d);
          const esHoy = mismoDia(d, hoy);
          const seleccionado = selectedDate && mismoDia(d, selectedDate);

          // Cuenta por estado para colorear puntitos (máx 3 dots distintos)
          const estados = Array.from(new Set(dCitas.map((c) => c.estado)));
          const dots = estados.slice(0, 4);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onDayClick?.(d, dCitas)}
              className={`relative aspect-square rounded-lg sm:rounded-xl border text-xs sm:text-sm font-semibold transition-all
                flex flex-col items-center justify-center gap-0.5
                ${
                  seleccionado
                    ? "border-primary bg-primary text-white shadow-glow scale-[1.02]"
                    : esHoy
                    ? "border-accent bg-accent/10 text-accent-dark"
                    : cantidad > 0
                    ? "border-primary/20 bg-primary-softer/40 text-primary-dark hover:border-primary hover:bg-primary-softer"
                    : "border-slate-100 bg-white text-slate-600 hover:border-primary/30 hover:bg-slate-50"
                }
                ${otroMes ? "opacity-35" : ""}
              `}
              title={
                cantidad > 0
                  ? `${cantidad} ${cantidad === 1 ? "cita" : "citas"}`
                  : ""
              }
            >
              <span>{d.getDate()}</span>

              {cantidad > 0 && (
                <div className="flex gap-0.5">
                  {dots.map((est) => (
                    <span
                      key={est}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: seleccionado
                          ? "white"
                          : estadoMeta(est).color,
                      }}
                    />
                  ))}
                </div>
              )}

              {cantidad > 1 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1
                    ${seleccionado ? "bg-white text-primary" : "bg-primary text-white shadow"}`}
                >
                  {cantidad}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] sm:text-xs text-slate-600">
        {Object.entries({
          pendiente: "Pendiente",
          aceptada: "Aceptada",
          en_proceso: "En proceso",
          finalizada: "Finalizada",
          cancelada: "Cancelada",
        }).map(([k, lbl]) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: estadoMeta(k).color }}
            />
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}
