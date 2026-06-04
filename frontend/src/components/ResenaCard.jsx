import { FaTrash } from "react-icons/fa";
import StarRating from "./StarRating.jsx";

export default function ResenaCard({ resena, onDelete }) {
  const fecha = resena.fecha
    ? new Date(resena.fecha).toLocaleDateString("es", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-light/30 flex items-center justify-center text-primary-dark font-bold shrink-0">
            {resena.cliente?.nombre?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {resena.cliente?.nombre || "Usuario"}
            </p>
            <p className="text-xs text-gray-500">{fecha}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StarRating value={resena.calificacion} showNumber={false} />
          {onDelete && (
            <button
              onClick={() => onDelete(resena)}
              className="text-danger hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-danger/10"
              title="Eliminar reseña"
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>
      {resena.comentario && (
        <p className="mt-2 text-sm text-gray-700">{resena.comentario}</p>
      )}
    </div>
  );
}
