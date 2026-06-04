import { FaRoute, FaClock } from "react-icons/fa";
import { formatKm, traducirManiobra } from "../utils/geo";

function formatMin(seg) {
  if (seg == null) return "";
  const m = Math.round(seg / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

export default function RouteInstructions({ ruta, distanciaTotal, duracionTotal }) {
  const pasos = ruta?.steps || [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-primary-softer text-primary flex items-center justify-center">
            <FaRoute />
          </div>
          <div>
            <div className="text-xs text-slate-500">Distancia</div>
            <div className="font-bold text-primary-dark">
              {formatKm(distanciaTotal)}
            </div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <FaClock />
          </div>
          <div>
            <div className="text-xs text-slate-500">Tiempo en auto</div>
            <div className="font-bold text-primary-dark">
              {formatMin(duracionTotal)}
            </div>
          </div>
        </div>
      </div>

      {pasos.length === 0 ? (
        <div className="card text-center text-slate-500 text-sm">
          No hay instrucciones disponibles.
        </div>
      ) : (
        <ol className="card divide-y divide-slate-100 p-0 overflow-hidden">
          {pasos.map((step, i) => {
            const { texto, icono } = traducirManiobra(step);
            const km = step.distance != null ? step.distance / 1000 : null;
            return (
              <li
                key={i}
                className="flex items-start gap-3 p-3 hover:bg-primary-softer/40 transition-colors"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-softer text-2xl flex items-center justify-center">
                  {icono}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 leading-snug">
                    <span className="text-primary mr-1.5 font-bold">
                      {i + 1}.
                    </span>
                    {texto}
                  </div>
                  {km != null && km > 0 && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Avanza {formatKm(km)}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
