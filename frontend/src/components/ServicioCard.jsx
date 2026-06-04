import { FaClock, FaTag } from "react-icons/fa";

export default function ServicioCard({ servicio, onReservar, actions }) {
  return (
    <div className="glass-v2-soft p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between group">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-extrabold text-white">{servicio.nombre}</h4>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent-light border border-accent/30">
            <FaTag className="mr-1" /> {servicio.categoria}
          </span>
        </div>
        {servicio.descripcion && (
          <p className="text-sm text-white/75 mt-1">{servicio.descripcion}</p>
        )}
        <div className="text-sm text-white/55 mt-1 flex items-center gap-2">
          <FaClock /> {servicio.duracionMinutos} min
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end gap-3">
        <div className="text-2xl font-extrabold text-gradient-accent">
          ${Number(servicio.precio).toFixed(2)}
        </div>
        {onReservar && (
          <button
            onClick={() => onReservar(servicio)}
            className="btn-accent shine-on-hover"
          >
            Reservar
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
