import { Link } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaTools,
  FaTruck,
  FaCheckCircle,
  FaArrowRight,
  FaStore,
} from "react-icons/fa";
import StarRating from "./StarRating.jsx";
import { formatKm } from "../utils/geo";
import useTilt from "../hooks/useTilt";

export default function MecanicoCard({ mecanico, distancia }) {
  const fotos = (mecanico.fotosReferencia || "").split(",").filter(Boolean);
  const fotoPrincipal = fotos[0];
  const tilt = useTilt({ max: 6 });

  return (
    <Link
      to={`/mecanico/${mecanico.id}`}
      ref={tilt.ref}
      {...tilt.handlers}
      className="mec-card tilt-3d glass-v2-iridescent group"
    >
      {/* Borde eléctrico + halo + chispas */}
      <span className="current-glow" />
      <span className="current-border" />
      <span className="spark-dot" />
      <span className="spark-dot" />
      <span className="spark-dot" />
      <span className="spark-dot" />

      {/* Cabecera con foto */}
      <div className="mec-photo">
        <img
          src={fotoPrincipal || "/fondo_3.jpg"}
          alt={mecanico.usuario?.nombre || ""}
          loading="lazy"
        />

        {/* Badges flotantes */}
        <div className="absolute top-2 left-2 flex gap-1.5 z-[5]">
          {mecanico.aprobado && (
            <span className="badge bg-emerald-500/90 text-white text-[10px] backdrop-blur shadow-md">
              <FaCheckCircle className="mr-1" /> Verificado
            </span>
          )}
          {mecanico.esMovil && (
            <span className="badge bg-accent/90 text-white text-[10px] backdrop-blur shadow-md">
              <FaTruck className="mr-1" /> A domicilio
            </span>
          )}
        </div>

        {distancia != null && (
          <div className="absolute top-2 right-2 z-[5] badge bg-zinc-900/85 text-white text-[10px] font-bold backdrop-blur ring-1 ring-white/20">
            <FaMapMarkerAlt className="mr-1" /> {formatKm(distancia)}
          </div>
        )}

        {/* Avatar circular — foto de perfil o inicial */}
        <div className="mec-avatar overflow-hidden">
          {mecanico.usuario?.fotoPerfil ? (
            <img
              src={mecanico.usuario.fotoPerfil}
              alt={mecanico.usuario?.nombre || ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            mecanico.usuario?.nombre?.charAt(0) || "M"
          )}
        </div>
      </div>

      <div className="relative px-5 pt-12 pb-6 flex-1 flex flex-col gap-1">
        {mecanico.nombreLocal && (
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-light mb-0.5">
            <FaStore /> {mecanico.nombreLocal}
          </div>
        )}
        <h3 className="font-extrabold text-xl text-white line-clamp-1 drop-shadow">
          {mecanico.usuario?.nombre}
        </h3>

        <div className="mt-1 flex items-center gap-2">
          <StarRating value={mecanico.calificacionPromedio || 0} />
          <span className="text-xs text-white/60">
            ({mecanico.totalTrabajos || 0} trabajos)
          </span>
        </div>

        {mecanico.especialidades && (
          <div className="mt-2 text-sm text-white/85 flex items-start gap-1.5">
            <FaTools className="mt-0.5 text-accent-light flex-shrink-0" />
            <span className="line-clamp-1">{mecanico.especialidades}</span>
          </div>
        )}

        {mecanico.ubicacion && (
          <div className="mt-1 text-sm text-white/60 flex items-start gap-1.5">
            <FaMapMarkerAlt className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{mecanico.ubicacion}</span>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/10">
          <span className="text-xs text-white/55">
            {mecanico.servicios?.length || 0} servicios disponibles
          </span>
          <span className="text-sm font-bold text-accent-light inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver perfil <FaArrowRight className="text-xs" />
          </span>
        </div>
      </div>
    </Link>
  );
}
