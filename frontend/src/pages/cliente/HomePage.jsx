import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FaSearch,
  FaList,
  FaMap,
  FaCarCrash,
  FaLocationArrow,
  FaTools,
  FaCog,
  FaBolt,
  FaCarBattery,
  FaCircleNotch,
  FaTruck,
  FaTruckMoving,
  FaPlusCircle,
  FaWrench,
  FaShieldAlt,
  FaTimes,
  FaBell,
  FaArrowRight,
  FaUserPlus,
  FaSignInAlt,
} from "react-icons/fa";
import { listarMecanicos } from "../../api/mecanicos.api";
import { listarCategorias } from "../../api/servicios.api";
import { misCitas } from "../../api/citas.api";
import MecanicoCard from "../../components/MecanicoCard.jsx";
import MecanicosMap from "../../components/MecanicosMap.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import AgendarCitaWizard from "../../components/AgendarCitaWizard.jsx";
import useGeolocation from "../../hooks/useGeolocation";
import { distanciaKm } from "../../utils/geo";
import {
  combinarFechaHora,
  proximaCita,
  tiempoRestante,
} from "../../utils/citas";
import { useAuth } from "../../context/AuthContext.jsx";

const ICONOS_CATEGORIA = {
  Mantenimiento: <FaCog />,
  Frenos: <FaCircleNotch />,
  Motor: <FaBolt />,
  Transmisión: <FaCog />,
  Eléctrico: <FaCarBattery />,
  Llantas: <FaCircleNotch />,
  Diagnóstico: <FaShieldAlt />,
  Suspensión: <FaTruckMoving />,
  General: <FaWrench />,
};

export default function HomePage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esCliente = usuario?.rol === "cliente";
  const esVisitante = !usuario;
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [modo, setModo] = useState("lista"); // lista | mapa
  const [radioKm, setRadioKm] = useState(0); // 0 = sin filtro
  const [minRating, setMinRating] = useState(0); // 0..5
  const [soloDomicilio, setSoloDomicilio] = useState(false);
  const [orden, setOrden] = useState("auto"); // auto | rating | distancia
  const [showWizard, setShowWizard] = useState(false);
  const { pos, loading: geoLoading, locate } = useGeolocation();

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
  });

  const { data: mecanicos = [], isLoading } = useQuery({
    queryKey: ["mecanicos", q, categoria],
    queryFn: () => listarMecanicos({ q, categoria }),
  });

  // Solo los clientes autenticados tienen "mis citas" / próxima cita
  const { data: misCitasData = [] } = useQuery({
    queryKey: ["mis-citas"],
    queryFn: misCitas,
    enabled: esCliente,
  });
  const proxima = useMemo(() => proximaCita(misCitasData), [misCitasData]);

  function irAEmergencia() {
    if (esCliente) {
      navigate("/emergencia");
    } else {
      navigate("/login", { state: { from: "/emergencia" } });
    }
  }

  // Añadir distancia y aplicar filtros del cliente
  const mecanicosFiltrados = useMemo(() => {
    let list = mecanicos.map((m) => ({
      ...m,
      distancia:
        pos && m.latitud != null && m.longitud != null
          ? distanciaKm(pos.lat, pos.lng, m.latitud, m.longitud)
          : null,
    }));
    // Radio de búsqueda (solo con geolocalización)
    if (pos && radioKm > 0) {
      list = list.filter((m) => m.distancia != null && m.distancia <= radioKm);
    }
    // Solo mecánicos a domicilio
    if (soloDomicilio) {
      list = list.filter((m) => m.esMovil);
    }
    // Mínimo de estrellas
    if (minRating > 0) {
      list = list.filter((m) => (m.calificacionPromedio || 0) >= minRating);
    }
    // Orden
    const ordenEfectivo = orden === "auto" ? (pos ? "distancia" : "rating") : orden;
    list.sort((a, b) => {
      if (ordenEfectivo === "distancia") {
        if (a.distancia == null && b.distancia == null) return 0;
        if (a.distancia == null) return 1;
        if (b.distancia == null) return -1;
        return a.distancia - b.distancia;
      }
      // rating descendente, desempate por trabajos
      const ra = a.calificacionPromedio || 0;
      const rb = b.calificacionPromedio || 0;
      if (rb !== ra) return rb - ra;
      return (b.totalTrabajos || 0) - (a.totalTrabajos || 0);
    });
    return list;
  }, [mecanicos, pos, radioKm, soloDomicilio, minRating, orden]);

  const hayFiltros =
    q || categoria || (pos && radioKm > 0) || soloDomicilio || minRating > 0;

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      {/* Orbes flotantes de fondo */}
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

    <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-6">
      {/* Aviso para visitantes */}
      {esVisitante && <BannerVisitante />}

      {/* Recordatorio de próxima cita (solo cliente) */}
      {esCliente && proxima && <ProximaCitaMini cita={proxima} />}

      {/* HERO premium con CTA emergencia + búsqueda rápida */}
      <HeroPremium
        usuario={usuario}
        onEmergencia={irAEmergencia}
        onAgendar={esCliente ? () => setShowWizard(true) : null}
      />

      {/* Encabezado */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <span className="chip-premium mb-2">
            <FaTools /> Red de talleres
          </span>
          <h1 className="cliente-headline text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)]">
            Encuentra tu <span className="text-gradient-accent">mecánico ideal</span>
          </h1>
          <p className="text-white/65 text-sm mt-1.5 max-w-lg">
            Busca por nombre, especialidad o ubicación · cambia entre lista y mapa.
          </p>
        </div>
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/15 backdrop-blur">
          <button
            onClick={() => setModo("lista")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-all ${
              modo === "lista"
                ? "bg-white/95 shadow text-zinc-900"
                : "text-white/70 hover:text-white"
            }`}
          >
            <FaList /> Lista
          </button>
          <button
            onClick={() => setModo("mapa")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-all ${
              modo === "mapa"
                ? "bg-white/95 shadow text-zinc-900"
                : "text-white/70 hover:text-white"
            }`}
          >
            <FaMap /> Mapa
          </button>
        </div>
      </div>

      {/* Buscador + ubicación */}
      <div className="glass-v2 p-5 sm:p-6 space-y-4">
        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, especialidad o zona..."
              className="w-full px-4 py-2.5 pl-10 bg-white/5 border border-white/15 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-4 focus:ring-accent/30 focus:border-accent/60 backdrop-blur transition-all"
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
          <button
            onClick={pos ? () => {} : locate}
            disabled={geoLoading}
            className={
              pos ? "btn-success px-4" : "btn-outline px-4"
            }
            title={pos ? "Ubicación activada" : "Activar mi ubicación"}
          >
            <FaLocationArrow />
            <span className="hidden sm:inline">
              {pos ? "Ubicación activa" : geoLoading ? "Ubicando..." : "Cerca de mí"}
            </span>
          </button>
        </div>

        {/* Slider de distancia (solo si hay ubicación) */}
        {pos && (
          <div className="glass-v2-soft px-4 py-3">
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="font-semibold text-white/90">
                Radio de búsqueda
              </span>
              <span className="font-bold text-accent-light">
                {radioKm === 0 ? "Sin límite" : `${radioKm} km`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={radioKm}
              onChange={(e) => setRadioKm(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[10px] text-white/50 mt-0.5">
              <span>Sin límite</span>
              <span>10 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
          </div>
        )}

        {/* Categorías como chips visuales */}
        <div>
          <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
            Tipo de servicio
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoria("")}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                categoria === ""
                  ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                  : "bg-white/5 text-white/85 border-white/15 hover:border-accent/60 hover:bg-white/10 backdrop-blur"
              }`}
            >
              <FaTools /> Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoria(cat === categoria ? "" : cat)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  categoria === cat
                    ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                    : "bg-white/5 text-white/85 border-white/15 hover:border-accent/60 hover:bg-white/10 backdrop-blur"
                }`}
              >
                {ICONOS_CATEGORIA[cat] || <FaWrench />} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros avanzados de calidad (sin acciones de admin) */}
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-center pt-1">
          {/* Mínimo de estrellas */}
          <div>
            <div className="text-xs font-bold text-white/55 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
              Calificación mínima
              {minRating > 0 && (
                <span className="text-accent-light font-extrabold">
                  {minRating}★ o más
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMinRating(n === minRating ? 0 : n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                    minRating === n
                      ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                      : "bg-white/5 text-white/70 border-white/15 hover:border-accent/50 hover:bg-white/10 backdrop-blur"
                  }`}
                >
                  {n === 0 ? "Todas" : `${n}★`}
                </button>
              ))}
            </div>
          </div>

          {/* Solo a domicilio */}
          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={soloDomicilio}
              onChange={(e) => setSoloDomicilio(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-white/85 font-semibold inline-flex items-center gap-1.5">
              <FaTruck className="text-accent-light" /> Solo a domicilio
            </span>
          </label>

          {/* Orden */}
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="input-dark min-w-[160px]"
            title="Ordenar resultados"
          >
            <option value="auto">Orden: automático</option>
            <option value="rating">Mejor calificados</option>
            <option value="distancia">Más cercanos</option>
          </select>
        </div>

        {hayFiltros && (
          <button
            onClick={() => {
              setQ("");
              setCategoria("");
              setRadioKm(0);
              setMinRating(0);
              setSoloDomicilio(false);
              setOrden("auto");
            }}
            className="text-xs text-accent-light hover:underline font-semibold"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {/* Resultados */}
      {isLoading ? (
        <LoadingSpinner />
      ) : mecanicosFiltrados.length === 0 ? (
        <div className="glass-v2 text-center py-12">
          <FaSearch className="mx-auto text-4xl text-white/30 mb-3" />
          <h3 className="font-bold text-lg text-white">
            No encontramos mecánicos con esos filtros
          </h3>
          <p className="text-sm text-white/65 mt-1">
            Prueba quitando alguno o amplía el radio de búsqueda.
          </p>
        </div>
      ) : modo === "mapa" ? (
        <div className="space-y-3">
          <div className="text-sm text-white/75">
            <strong className="text-accent-light">
              {mecanicosFiltrados.length}
            </strong>{" "}
            {mecanicosFiltrados.length === 1
              ? "mecánico encontrado"
              : "mecánicos encontrados"}
            {mecanicosFiltrados.filter(
              (m) => m.latitud == null || m.longitud == null,
            ).length > 0 && (
              <span className="text-xs text-white/50 ml-2">
                (algunos no aparecen en el mapa porque no han registrado su
                ubicación)
              </span>
            )}
          </div>
          <div className="h-[460px] sm:h-[560px]">
            <MecanicosMap
              mecanicos={mecanicosFiltrados}
              miPos={pos}
              height="100%"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-white/75">
            <strong className="text-accent-light">
              {mecanicosFiltrados.length}
            </strong>{" "}
            {mecanicosFiltrados.length === 1
              ? "mecánico encontrado"
              : "mecánicos encontrados"}
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
            {mecanicosFiltrados.map((m) => (
              <MecanicoCard
                key={m.id}
                mecanico={m}
                distancia={m.distancia}
              />
            ))}
          </div>
        </div>
      )}

      {showWizard && <AgendarCitaWizard onClose={() => setShowWizard(false)} />}
    </div>
    </div>
  );
}

function BannerVisitante() {
  return (
    <div className="glass-v2 p-4 sm:p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent-light flex items-center justify-center shrink-0 ring-1 ring-accent/30">
        <FaUserPlus className="text-xl" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white">
          Estás navegando como visitante
        </div>
        <div className="text-sm text-white/70">
          Puedes ver todos los mecánicos, sus servicios y ubicaciones. Para
          reservar una cita o dejar una reseña, crea tu cuenta gratis.
        </div>
      </div>
      <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
        <Link to="/registro" className="btn-primary text-xs py-1.5 px-3">
          <FaUserPlus /> Crear cuenta
        </Link>
        <Link to="/login" className="btn-outline text-xs py-1.5 px-3">
          <FaSignInAlt /> Entrar
        </Link>
      </div>
      <Link
        to="/registro"
        className="btn-primary sm:hidden text-xs py-1.5 px-3 shrink-0"
      >
        Crear cuenta
      </Link>
    </div>
  );
}

function ProximaCitaMini({ cita }) {
  const dt = combinarFechaHora(cita.fecha, cita.hora);
  const cuando = tiempoRestante(dt);
  return (
    <Link
      to="/mis-citas"
      className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-4 hover:shadow-[0_22px_50px_-16px_rgba(91,225,255,0.4)] flex items-center gap-4 group"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/30 rounded-full blur-2xl" />
      <div className="relative w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 animate-pulse">
        <FaBell />
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold">
          Recordatorio · próxima cita
        </div>
        <div className="font-bold leading-tight truncate text-white">
          {cita.nombreServicio || cita.servicio?.nombre}{" "}
          {cuando && (
            <span className="text-accent-light font-extrabold">· {cuando}</span>
          )}
        </div>
        <div className="text-xs text-white/75 truncate">
          {cita.fecha} {cita.hora} · {cita.mecanico?.usuario?.nombre}
        </div>
      </div>
      <FaArrowRight className="relative shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function HeroPremium({ usuario, onEmergencia, onAgendar }) {
  const saludo = usuario ? `Hola, ${usuario.nombre?.split(" ")[0] || ""}` : "Bienvenido";
  return (
    <section className="glass-v2 glass-v2-iridescent relative overflow-hidden p-6 sm:p-8">
      {/* Líneas geométricas decorativas */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hpline" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#5be1ff" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <path
          d="M0,150 C200,80 400,180 600,90 L800,140 L800,200 L0,200 Z"
          fill="url(#hpline)"
        />
      </svg>

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
        {/* Saludo + acciones */}
        <div className="flex-1 min-w-0">
          <span className="chip-premium">
            <FaBolt className="text-accent-light" /> Asistente Mecánico 2026
          </span>
          <h2 className="cliente-headline text-white drop-shadow mt-3">
            {saludo} <span className="text-gradient-accent">.</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-white/70 max-w-xl">
            Tu garaje inteligente. Encuentra talleres verificados, reserva al
            instante y recibe asistencia en emergencia.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {onAgendar && (
              <button
                type="button"
                onClick={onAgendar}
                className="relative group px-5 py-2.5 rounded-xl font-extrabold text-zinc-950 bg-gradient-to-br from-accent to-accent-dark shadow-[0_12px_36px_-10px_rgba(245,158,11,0.7)] hover:shadow-[0_18px_48px_-10px_rgba(245,158,11,0.9)] hover:-translate-y-0.5 transition-all overflow-hidden inline-flex items-center gap-2 shine-on-hover"
              >
                <FaPlusCircle className="text-lg" /> Agendar cita
              </button>
            )}
            <Link
              to="/mis-citas"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold inline-flex items-center gap-2 backdrop-blur transition-all"
            >
              <FaBell /> Mis citas
            </Link>
            <Link
              to="/perfil"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold inline-flex items-center gap-2 backdrop-blur transition-all"
            >
              <FaTools /> Mi perfil
            </Link>
          </div>
        </div>

        {/* Botón SOS premium */}
        <button
          onClick={onEmergencia}
          className="relative w-full lg:w-auto group shrink-0"
        >
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-red-600 to-red-800 border border-red-400/50 shadow-[0_18px_50px_-12px_rgba(220,38,38,0.7)] hover:shadow-[0_22px_60px_-12px_rgba(220,38,38,0.9)] transition-all group-hover:-translate-y-0.5">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,0.25),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3 text-white text-left">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl animate-pulse">
                <FaCarCrash />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                  Emergencia · 24/7
                </div>
                <div className="font-extrabold text-lg leading-tight">
                  ¿Tu auto se averió?
                </div>
                <div className="text-xs text-white/85 mt-0.5">
                  Activa SOS y te guiamos hasta el taller más cercano →
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
