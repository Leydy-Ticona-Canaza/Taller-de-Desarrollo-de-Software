import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaTools,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { estadoMeta } from "../utils/citas";

export default function CitaCard({ cita, perspective = "cliente", actions }) {
  const estado = estadoMeta(cita.estado);
  const persona =
    perspective === "cliente" ? cita.mecanico?.usuario : cita.cliente;

  return (
    <div
      className="glass-panel overflow-hidden p-0 border-l-4"
      style={{ borderLeftColor: estado.color }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className="badge text-white text-[10px] shadow-md"
                style={{ backgroundColor: estado.color }}
              >
                {estado.label}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-accent-light">
                <FaClock /> {cita.hora}
              </span>
            </div>

            <h4 className="font-extrabold text-white leading-tight">
              {cita.nombreServicio || cita.servicio?.nombre}
            </h4>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-white/80">
              <span className="flex items-center gap-1.5 min-w-0">
                <FaUser className="text-accent-light shrink-0" />
                <span className="truncate">{persona?.nombre || "—"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FaCalendarAlt className="text-accent-light shrink-0" />
                {cita.fecha}
              </span>
              {cita.precioServicio != null && (
                <span className="flex items-center gap-1.5">
                  <FaTools className="text-accent-light shrink-0" /> $
                  {Number(cita.precioServicio).toFixed(2)}
                </span>
              )}
              {persona?.telefono && (
                <a
                  href={`tel:${persona.telefono}`}
                  className="flex items-center gap-1.5 hover:text-accent-light transition-colors"
                >
                  <FaPhone className="text-accent-light shrink-0" />
                  <span className="truncate">{persona.telefono}</span>
                </a>
              )}
            </div>

            {perspective === "cliente" &&
              cita.mecanico?.ubicacion && (
                <div className="mt-1 text-xs text-white/55 flex items-start gap-1.5">
                  <FaMapMarkerAlt className="mt-0.5 shrink-0 text-accent-light" />
                  <span className="line-clamp-1">
                    {cita.mecanico.ubicacion}
                  </span>
                </div>
              )}

            {cita.descripcionProblema && (
              <p
                className="mt-2 text-xs italic px-2 py-1.5 rounded bg-white/5 text-white/80 border-l-2"
                style={{ borderLeftColor: estado.color }}
              >
                "{cita.descripcionProblema}"
              </p>
            )}
          </div>
          {actions && (
            <div className="flex gap-2 flex-wrap shrink-0">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
