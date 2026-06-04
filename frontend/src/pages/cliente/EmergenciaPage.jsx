import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaExclamationTriangle,
  FaCarCrash,
  FaLocationArrow,
  FaPhone,
  FaTruck,
  FaCheckCircle,
  FaRedo,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { listarMecanicos } from "../../api/mecanicos.api";
import useGeolocation from "../../hooks/useGeolocation";
import { distanciaKm, formatKm } from "../../utils/geo";
import RouteMap from "../../components/RouteMap.jsx";
import RouteInstructions from "../../components/RouteInstructions.jsx";
import StarRating from "../../components/StarRating.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

export default function EmergenciaPage() {
  const navigate = useNavigate();
  const { pos, loading: geoLoading, error: geoError, locate } = useGeolocation();
  const [seleccionado, setSeleccionado] = useState(null);
  const [ruta, setRuta] = useState(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);

  const { data: mecanicos = [], isLoading } = useQuery({
    queryKey: ["mecanicos-emergencia"],
    queryFn: () => listarMecanicos({}),
  });

  // Filtrar mecánicos con coordenadas y calcular distancia
  const cercanos = useMemo(() => {
    if (!pos) return [];
    return mecanicos
      .filter((m) => m.latitud != null && m.longitud != null)
      .map((m) => ({
        ...m,
        distancia: distanciaKm(pos.lat, pos.lng, m.latitud, m.longitud),
      }))
      .sort((a, b) => a.distancia - b.distancia);
  }, [mecanicos, pos]);

  // Cargar ruta cuando se selecciona un mecánico
  useEffect(() => {
    if (!seleccionado || !pos) {
      setRuta(null);
      return;
    }
    let cancelado = false;
    async function cargarRuta() {
      setCargandoRuta(true);
      setRuta(null);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${seleccionado.longitud},${seleccionado.latitud}?overview=full&geometries=geojson&steps=true`;
        const r = await fetch(url);
        const data = await r.json();
        if (cancelado) return;
        if (data.code !== "Ok" || !data.routes?.length) {
          toast.error("No se pudo calcular la ruta");
          return;
        }
        const route = data.routes[0];
        setRuta({
          coordinates: route.geometry.coordinates,
          steps: route.legs?.[0]?.steps || [],
          distance: route.distance,
          duration: route.duration,
        });
      } catch {
        if (!cancelado) toast.error("Error de red al calcular la ruta");
      } finally {
        if (!cancelado) setCargandoRuta(false);
      }
    }
    cargarRuta();
    return () => {
      cancelado = true;
    };
  }, [seleccionado, pos]);

  // ----- Vista 1: pedir ubicación -----
  if (!pos) {
    return (
      <div className="bg-cliente-glass min-h-full text-white">
        <span className="mesh-orb o1" aria-hidden />
        <span className="mesh-orb o2" aria-hidden />
        <span className="mesh-orb o3" aria-hidden />
      <div className="relative max-w-3xl mx-auto px-4 py-10">
        <div className="glass-v2 relative overflow-hidden text-center p-8 animate-fade-in-up">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-danger/30 rounded-full blur-3xl pointer-events-none animate-blob" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/25 rounded-full blur-3xl pointer-events-none animate-blob" style={{ animationDelay: "3s" }} />

          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-danger to-red-700 text-white text-4xl mx-auto mb-4 flex items-center justify-center shadow-glow animate-pulse-glow">
              <FaCarCrash />
            </div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow">
              ¿Tu auto se <span className="text-gradient-accent">averió</span>?
            </h1>
            <p className="mt-3 text-white/75 max-w-md mx-auto">
              No te preocupes. Te ayudaremos a encontrar el taller más cercano
              y te guiaremos paso a paso para llegar.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 my-7 text-left">
              {[
                {
                  n: 1,
                  t: "Activa tu ubicación",
                  d: "Para encontrar mecánicos cerca de ti.",
                },
                {
                  n: 2,
                  t: "Elige un taller",
                  d: "Los más cercanos aparecerán primero.",
                },
                {
                  n: 3,
                  t: "Sigue la ruta",
                  d: "Te damos indicaciones con flechas.",
                },
              ].map((p) => (
                <div key={p.n} className="glass-v2-soft p-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark text-zinc-950 font-extrabold flex items-center justify-center mb-2 shadow-glow-accent">
                    {p.n}
                  </div>
                  <div className="font-bold text-white">{p.t}</div>
                  <div className="text-sm text-white/65 mt-1">{p.d}</div>
                </div>
              ))}
            </div>

            {geoError && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3 backdrop-blur">
                <FaExclamationTriangle className="inline mr-1" /> {geoError}
              </div>
            )}

            <button
              onClick={locate}
              disabled={geoLoading}
              className="btn-accent text-base px-8 py-4 animate-pulse-glow shine-on-hover"
            >
              <FaLocationArrow />
              {geoLoading ? "Ubicándote..." : "Activar mi ubicación"}
            </button>

            <p className="text-xs text-white/55 mt-4">
              Tu navegador te pedirá permiso. Solo usamos tu ubicación para
              esta búsqueda, no se guarda.
            </p>
          </div>
        </div>
      </div>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner text="Buscando talleres cercanos..." />;

  // ----- Vista 2: lista + mapa + ruta -----
  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />
    <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-5 animate-fade-in-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-danger to-red-700 text-white flex items-center justify-center shadow-glow animate-pulse">
            <FaCarCrash className="text-xl" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow">
              Asistencia de <span className="text-gradient-accent">emergencia</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/65 flex items-center gap-1.5 flex-wrap">
              <FaMapMarkerAlt className="text-accent-light shrink-0" />
              <span className="truncate">
                Tu ubicación: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
              </span>
              {pos.acc && (
                <span className="text-white/45">
                  (±{Math.round(pos.acc)} m)
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={locate}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-accent-light bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all inline-flex items-center gap-2"
          title="Actualizar ubicación"
        >
          <FaRedo /> Actualizar
        </button>
      </div>

      {cercanos.length === 0 ? (
        <div className="glass-v2 text-center py-10">
          <FaExclamationTriangle className="mx-auto text-4xl text-accent-light mb-3" />
          <h3 className="font-bold text-lg text-white">
            No hay talleres con ubicación registrada cerca de ti
          </h3>
          <p className="text-white/65 text-sm mt-2 max-w-md mx-auto">
            Los mecánicos pueden no haber agregado su ubicación todavía. Prueba
            la búsqueda regular.
          </p>
          <button
            onClick={() => navigate("/buscar")}
            className="btn-accent mt-4 shine-on-hover"
          >
            Ver todos los mecánicos
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[360px_1fr] gap-4 lg:gap-5">
          {/* Lista de cercanos */}
          <aside className="space-y-3">
            <div className="glass-v2-soft p-4">
              <div className="flex items-center gap-2 mb-1">
                <FaCheckCircle className="text-emerald-400" />
                <span className="font-bold text-white">
                  {cercanos.length} {cercanos.length === 1 ? "taller" : "talleres"} encontrados
                </span>
              </div>
              <p className="text-xs text-white/65">
                Toca uno para ver la ruta paso a paso desde tu posición.
              </p>
            </div>

            <div className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto pr-1 stagger">
              {cercanos.map((m, idx) => {
                const activo = seleccionado?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSeleccionado(m)}
                    className={`glass-panel-soft text-left w-full p-4 transition-all ${
                      activo
                        ? "ring-2 ring-accent shadow-glow-accent !border-accent/60"
                        : "hover:-translate-y-0.5 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg ${
                          idx === 0
                            ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 shadow-glow-accent"
                            : "bg-white/10 text-white border border-white/15"
                        }`}
                      >
                        {idx === 0 ? "★" : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-white truncate">
                            {m.usuario?.nombre}
                          </h3>
                          {m.esMovil && (
                            <span className="badge bg-accent/25 text-accent-light text-[10px] border border-accent/40">
                              <FaTruck className="mr-1" /> Móvil
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating value={m.calificacionPromedio || 0} />
                        </div>
                        {m.especialidades && (
                          <div className="text-xs text-white/70 mt-1.5 line-clamp-1">
                            {m.especialidades}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-white/55 flex items-center gap-1">
                            <FaMapMarkerAlt /> {formatKm(m.distancia)} de ti
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold text-accent-light uppercase tracking-wider">
                              Más cercano
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mapa + ruta */}
          <section className="space-y-4">
            {!seleccionado ? (
              <div className="glass-v2 text-center py-16">
                <FaLocationArrow className="mx-auto text-5xl text-accent-light mb-3 animate-float" />
                <h3 className="font-bold text-lg text-white">
                  Selecciona un taller
                </h3>
                <p className="text-sm text-white/65 mt-1">
                  Te mostraré el camino con instrucciones paso a paso.
                </p>
              </div>
            ) : (
              <>
                <div className="glass-v2 p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-xs text-white/55 uppercase tracking-wider mb-1">
                        Ruta hacia
                      </div>
                      <h2 className="text-xl font-extrabold text-white">
                        {seleccionado.usuario?.nombre}
                      </h2>
                      {seleccionado.ubicacion && (
                        <p className="text-sm text-white/70 flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt className="text-accent-light" />
                          {seleccionado.ubicacion}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {seleccionado.usuario?.telefono && (
                        <a
                          href={`tel:${seleccionado.usuario.telefono}`}
                          className="btn-accent text-sm px-3 py-2"
                        >
                          <FaPhone /> Llamar
                        </a>
                      )}
                      <button
                        onClick={() => navigate(`/mecanico/${seleccionado.id}`)}
                        className="px-3 py-2 rounded-xl text-sm font-semibold text-accent-light bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all"
                      >
                        Ver perfil
                      </button>
                    </div>
                  </div>

                  <div className="h-[320px] sm:h-[400px]">
                    <RouteMap
                      origen={pos}
                      destino={{
                        lat: seleccionado.latitud,
                        lng: seleccionado.longitud,
                      }}
                      ruta={ruta}
                      labelDestino={seleccionado.usuario?.nombre}
                      height="100%"
                    />
                  </div>
                </div>

                {cargandoRuta ? (
                  <LoadingSpinner text="Calculando la mejor ruta..." />
                ) : ruta ? (
                  <RouteInstructions
                    ruta={ruta}
                    distanciaTotal={ruta.distance / 1000}
                    duracionTotal={ruta.duration}
                  />
                ) : null}
              </>
            )}
          </section>
        </div>
      )}
    </div>
    </div>
  );
}
