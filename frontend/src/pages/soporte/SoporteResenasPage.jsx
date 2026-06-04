import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaCommentDots,
  FaSearch,
  FaTimes,
  FaTrash,
  FaTools,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  soporteListarResenas,
  soporteEliminarResena,
} from "../../api/soporte.api";
import StarRating from "../../components/StarRating.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";

export default function SoporteResenasPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const success = useSuccess();
  const [q, setQ] = useState("");

  const params = useMemo(() => (q ? { q } : {}), [q]);

  const { data: resenas = [], isLoading } = useQuery({
    queryKey: ["soporte-resenas", params],
    queryFn: () => soporteListarResenas(params),
  });

  const eliminarMut = useMutation({
    mutationFn: soporteEliminarResena,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["soporte-resenas"] });
      success({
        title: "Reseña eliminada",
        message:
          "La reseña fue removida y la calificación del mecánico se actualizó.",
        emoji: "🗑️",
      });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "Error al eliminar"),
  });

  async function pedirEliminar(r) {
    const ok = await confirm({
      title: "¿Eliminar reseña?",
      message: `Vas a eliminar la reseña de:\n\n${r.cliente?.nombre || "Usuario"} ➜ ${r.mecanico?.usuario?.nombre || "Mecánico"}\n\nCalificación: ${r.calificacion} ★\n"${r.comentario || "(sin comentario)"}"\n\nEsta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tipo: "danger",
    });
    if (ok) eliminarMut.mutate(r.id);
  }

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-5 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-violet-400/40 via-accent/30 to-cyan-400/30 blur-xl opacity-70" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-2xl text-xl">
              <FaCommentDots />
            </div>
          </div>
          <div>
            <span className="chip-premium">Moderación</span>
            <h1 className="cliente-headline text-white drop-shadow mt-2">
              Reseñas <span className="text-gradient-accent">públicas</span>
            </h1>
            <p className="text-sm text-white/65 mt-1">
              Elimina reseñas con lenguaje ofensivo, falsas o irrelevantes.
            </p>
          </div>
        </div>

        <div className="glass-v2 p-5">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar texto en los comentarios..."
              className="input-dark pl-10"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : resenas.length === 0 ? (
          <div className="glass-v2 text-center py-10">
            <FaCommentDots className="mx-auto text-4xl text-white/30 mb-2" />
            <p className="text-white/65">No hay reseñas para mostrar.</p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {resenas.map((r) => (
              <ResenaModeracionCard
                key={r.id}
                resena={r}
                onDelete={() => pedirEliminar(r)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResenaModeracionCard({ resena, onDelete }) {
  const fecha = resena.fecha
    ? new Date(resena.fecha).toLocaleString("es", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="glass-v2 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-extrabold text-white">
              {resena.cliente?.nombre || "Cliente"}
            </span>
            <span className="text-white/40">➜</span>
            <span className="inline-flex items-center gap-1 font-semibold text-white/85">
              <FaTools className="text-accent-light text-xs" />
              {resena.mecanico?.usuario?.nombre || "Mecánico"}
            </span>
            {resena.mecanico?.id && (
              <Link
                to={`/mecanico/${resena.mecanico.id}`}
                className="text-xs text-accent-light hover:underline inline-flex items-center gap-1"
                title="Ver perfil del mecánico"
              >
                <FaExternalLinkAlt /> Ver perfil
              </Link>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/55">
            <StarRating value={resena.calificacion} showNumber={false} />
            <span>·</span>
            <span>{fecha}</span>
            {resena.citaId == null && (
              <>
                <span>·</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-400/20 text-violet-300 border border-violet-400/30 text-[10px] font-bold">
                  Reseña de perfil
                </span>
              </>
            )}
          </div>
          {resena.comentario ? (
            <p className="mt-2 text-sm text-white/85 whitespace-pre-line">
              {resena.comentario}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-white/40">(Sin comentario)</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border border-red-400/50 shadow-[0_8px_24px_-10px_rgba(220,38,38,0.6)] transition-all inline-flex items-center gap-1.5"
          title="Eliminar reseña"
        >
          <FaTrash /> Eliminar
        </button>
      </div>
    </div>
  );
}
