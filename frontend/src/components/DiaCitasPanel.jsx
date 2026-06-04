import { FaCalendarAlt, FaInbox } from "react-icons/fa";
import { DIAS_CORTOS_ES, MESES_ES, mismoDia } from "../utils/citas";
import CitaCard from "./CitaCard.jsx";

function formatDia(d) {
  if (!d) return "";
  return `${DIAS_CORTOS_ES[d.getDay()]}, ${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function DiaCitasPanel({
  fecha,
  citas = [],
  perspective = "cliente",
  renderActions,
}) {
  const esHoy = fecha && mismoDia(fecha, new Date());

  return (
    <div className="card sticky top-20">
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-slate-100">
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-xl shadow-glow">
          <FaCalendarAlt />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {esHoy && (
              <span className="badge bg-accent/15 text-accent text-[10px]">
                Hoy
              </span>
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {citas.length} {citas.length === 1 ? "cita" : "citas"}
            </span>
          </div>
          <h3 className="font-extrabold text-primary-dark leading-tight mt-0.5">
            {fecha ? formatDia(fecha) : "Selecciona un día"}
          </h3>
        </div>
      </div>

      {!fecha ? (
        <div className="text-center text-slate-500 py-10">
          <FaCalendarAlt className="mx-auto text-4xl text-slate-300 mb-2" />
          <p className="text-sm">
            Toca cualquier día del calendario para ver sus citas.
          </p>
        </div>
      ) : citas.length === 0 ? (
        <div className="text-center text-slate-500 py-10">
          <FaInbox className="mx-auto text-4xl text-slate-300 mb-2" />
          <p className="text-sm">No hay citas este día.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {citas
            .slice()
            .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""))
            .map((c) => (
              <CitaCard
                key={c.id}
                cita={c}
                perspective={perspective}
                actions={renderActions ? renderActions(c) : null}
              />
            ))}
        </div>
      )}
    </div>
  );
}
