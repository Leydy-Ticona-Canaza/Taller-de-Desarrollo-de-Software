import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaTools,
  FaUser,
  FaWrench,
  FaCalendarAlt,
  FaClock,
  FaStore,
  FaMapMarkerAlt,
  FaTruck,
  FaStar,
  FaCommentAlt,
} from "react-icons/fa";
import { listarMecanicos } from "../api/mecanicos.api";
import { listarCategorias } from "../api/servicios.api";
import { crearCita, horariosOcupados } from "../api/citas.api";
import { useSuccess } from "../context/SuccessContext.jsx";

function generarHoras(inicio = "08:00", fin = "18:00") {
  const horas = [];
  const [hi] = inicio.split(":").map(Number);
  const [hf] = fin.split(":").map(Number);
  for (let h = hi; h <= hf - 1; h++) {
    horas.push(`${String(h).padStart(2, "0")}:00`);
    horas.push(`${String(h).padStart(2, "0")}:30`);
  }
  return horas;
}

export default function AgendarCitaWizard({ onClose, mecanicoInicial = null }) {
  const navigate = useNavigate();
  const success = useSuccess();

  // Si llegamos con un mecánico pre-seleccionado, saltamos el paso "Mecánico"
  const preElegido = !!mecanicoInicial;
  const PASOS = preElegido
    ? [
        { n: 1, t: "Tipos de trabajo", icon: <FaTools /> },
        { n: 2, t: "Servicio", icon: <FaWrench /> },
        { n: 3, t: "Fecha y hora", icon: <FaCalendarAlt /> },
        { n: 4, t: "Comentario y confirmar", icon: <FaCheckCircle /> },
      ]
    : [
        { n: 1, t: "Tipos de trabajo", icon: <FaTools /> },
        { n: 2, t: "Taller", icon: <FaUser /> },
        { n: 3, t: "Servicio", icon: <FaWrench /> },
        { n: 4, t: "Fecha y hora", icon: <FaCalendarAlt /> },
        { n: 5, t: "Comentario y confirmar", icon: <FaCheckCircle /> },
      ];
  const TOTAL = PASOS.length;
  const PASO_SERVICIO = preElegido ? 2 : 3;
  const PASO_FECHA = preElegido ? 3 : 4;
  const PASO_CONFIRMAR = preElegido ? 4 : 5;

  const [paso, setPaso] = useState(1);
  const [categoriasSel, setCategoriasSel] = useState([]); // multi-select, opcional
  const [mecanico, setMecanico] = useState(mecanicoInicial);
  const [servicio, setServicio] = useState(null);
  const [consultaGeneral, setConsultaGeneral] = useState(false); // true = sin servicio específico
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
  });

  const { data: todosMecanicos = [], isLoading: lMec } = useQuery({
    queryKey: ["mecanicos"],
    queryFn: () => listarMecanicos({}),
    enabled: !preElegido && paso >= 2,
  });

  const { data: ocupadasData } = useQuery({
    queryKey: ["ocupadas", mecanico?.id, fecha],
    queryFn: () => horariosOcupados(mecanico.id, fecha),
    enabled: !!mecanico?.id && !!fecha,
  });
  const horasOcupadas = new Set(ocupadasData?.horasOcupadas || []);

  const horas = useMemo(
    () => generarHoras(mecanico?.horarioInicio, mecanico?.horarioFin),
    [mecanico],
  );

  // Mecánicos: si hay categorías sugeridas, los recomendados primero
  const matcheaCategorias = (m) => {
    if (!categoriasSel.length) return false;
    return m.servicios?.some(
      (s) => s.activo && categoriasSel.includes(s.categoria),
    );
  };
  const mecanicos = useMemo(() => {
    if (!categoriasSel.length) return todosMecanicos;
    const ok = todosMecanicos.filter(matcheaCategorias);
    const otros = todosMecanicos.filter((m) => !matcheaCategorias(m));
    return [...ok, ...otros];
  }, [todosMecanicos, categoriasSel]);
  const totalSugeridosMec = todosMecanicos.filter(matcheaCategorias).length;

  // Servicios del mecánico con orden por categorías sugeridas
  const serviciosOrdenados = useMemo(() => {
    if (!mecanico?.servicios) return [];
    const activos = mecanico.servicios.filter((s) => s.activo);
    if (!categoriasSel.length) return activos;
    const ok = activos.filter((s) => categoriasSel.includes(s.categoria));
    const otros = activos.filter((s) => !categoriasSel.includes(s.categoria));
    return [...ok, ...otros];
  }, [mecanico, categoriasSel]);
  const totalSugeridosSrv =
    categoriasSel.length && mecanico?.servicios
      ? mecanico.servicios.filter(
          (s) => s.activo && categoriasSel.includes(s.categoria),
        ).length
      : 0;

  const mut = useMutation({
    mutationFn: crearCita,
    onSuccess: async () => {
      await success({
        title: "¡Cita solicitada!",
        message:
          "Tu solicitud fue enviada al mecánico. Te avisaremos cuando la confirme.",
        emoji: "🔧",
        actionLabel: "Ver mis citas",
      });
      onClose();
      navigate("/mis-citas");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error al reservar"),
  });

  function confirmar() {
    if (!fecha || !hora) return toast.error("Falta fecha u hora");
    const partes = [];
    if (consultaGeneral) {
      partes.push(
        "Solicitud de consulta general (el taller aún no tiene servicios publicados)",
      );
    }
    if (categoriasSel.length) {
      partes.push(`Trabajo solicitado: ${categoriasSel.join(", ")}`);
    }
    if (descripcion.trim()) {
      partes.push(descripcion.trim());
    }
    const desc = partes.join("\n\n") || null;
    mut.mutate({
      mecanicoId: mecanico.id,
      servicioId: consultaGeneral ? null : servicio?.id,
      fecha,
      hora,
      descripcionProblema: desc,
    });
  }

  function toggleCategoria(c) {
    setCategoriasSel((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  // ¿Se puede avanzar al siguiente paso?
  const puedeAvanzar = (() => {
    if (paso === 1) return true; // categorías son opcionales
    if (!preElegido && paso === 2) return !!mecanico;
    if (paso === PASO_SERVICIO) return !!servicio || consultaGeneral;
    if (paso === PASO_FECHA) return !!fecha && !!hora;
    return true;
  })();

  function siguiente() {
    if (paso < TOTAL) setPaso(paso + 1);
  }
  function atras() {
    if (paso > 1) setPaso(paso - 1);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-v2 w-full max-w-2xl max-h-[94vh] overflow-y-auto p-0 rounded-3xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 sm:px-6 py-4 border-b border-white/10 bg-gradient-to-r from-zinc-950/80 to-zinc-900/80 backdrop-blur flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="chip-premium text-[9px] py-1 px-2.5">
              <FaCalendarAlt /> Nueva cita
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1.5 truncate">
              {preElegido && mecanico?.usuario?.nombre
                ? `Agendar con ${mecanico.usuario.nombre}`
                : "Agendar cita"}{" "}
              ·{" "}
              <span className="text-accent-light">
                paso {paso} de {TOTAL}
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white shrink-0"
          >
            <FaTimes />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-1.5">
            {PASOS.map((p) => (
              <div
                key={p.n}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  paso > p.n
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : paso === p.n
                      ? "bg-gradient-to-r from-accent to-accent-light"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-white/55">
            {PASOS[paso - 1].t}
          </div>
        </div>

        {/* Contenido */}
        <div className="px-5 sm:px-6 py-5 space-y-4">
          {paso === 1 && (
            <>
              <p className="text-sm text-white/70">
                ¿Qué tipo de trabajo necesitas?{" "}
                <span className="text-white/45">
                  Marca <b>una o varias</b> categorías para que el taller
                  entienda mejor (opcional).
                </span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categorias.map((c) => {
                  const sel = categoriasSel.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleCategoria(c)}
                      className={`relative px-3 py-3 rounded-xl text-sm font-semibold border transition-all ${
                        sel
                          ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                          : "bg-white/5 text-white/85 border-white/15 hover:border-accent/50 hover:bg-white/10 backdrop-blur"
                      }`}
                    >
                      {sel && (
                        <FaCheckCircle className="absolute top-1.5 right-1.5 text-xs" />
                      )}
                      <FaWrench className="mx-auto mb-1" /> {c}
                    </button>
                  );
                })}
              </div>
              {categoriasSel.length > 0 && (
                <div className="text-xs text-white/65">
                  Seleccionadas:{" "}
                  <span className="text-accent-light font-bold">
                    {categoriasSel.join(", ")}
                  </span>
                </div>
              )}
            </>
          )}

          {!preElegido && paso === 2 && (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-white/70">
                  {lMec
                    ? "Buscando talleres..."
                    : categoriasSel.length
                      ? `${totalSugeridosMec} recomendados de ${todosMecanicos.length}`
                      : `${mecanicos.length} talleres disponibles`}
                </p>
                {categoriasSel.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 text-accent-light border border-accent/30 text-[10px] font-bold uppercase tracking-wider">
                    Sugerencia: {categoriasSel.join(" · ")}
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {mecanicos.map((m, idx) => {
                  const esRec = matcheaCategorias(m);
                  const esDivisor =
                    categoriasSel.length > 0 &&
                    idx === totalSugeridosMec &&
                    totalSugeridosMec > 0 &&
                    totalSugeridosMec < mecanicos.length;
                  return (
                    <Fragment key={m.id}>
                      {esDivisor && (
                        <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/45 mt-3 mb-1">
                          Otros talleres
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMecanico(m);
                          setServicio(null);
                          siguiente();
                        }}
                        className={`w-full glass-v2-soft p-4 text-left flex items-center gap-3 hover:border-accent/50 transition-all ${
                          mecanico?.id === m.id
                            ? "!border-accent ring-1 ring-accent/40"
                            : ""
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 font-bold flex items-center justify-center shrink-0">
                          {m.usuario?.fotoPerfil ? (
                            <img
                              src={m.usuario.fotoPerfil}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            m.usuario?.nombre?.charAt(0) || "M"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {m.nombreLocal && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-light">
                                <FaStore /> {m.nombreLocal}
                              </div>
                            )}
                            {esRec && (
                              <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider">
                                Recomendado
                              </span>
                            )}
                          </div>
                          <div className="font-extrabold text-white truncate">
                            {m.usuario?.nombre}
                          </div>
                          <div className="text-xs text-white/65 truncate flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <FaStar className="text-amber-300" />{" "}
                              {(m.calificacionPromedio || 0).toFixed(1)}
                            </span>
                            {m.esMovil && (
                              <span className="inline-flex items-center gap-1 text-accent-light">
                                <FaTruck /> Domicilio
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </Fragment>
                  );
                })}
              </div>
            </>
          )}

          {paso === PASO_SERVICIO && (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-white/70">
                  Elige el servicio de{" "}
                  <span className="font-bold text-accent-light">
                    {mecanico?.usuario?.nombre}
                  </span>
                  .
                </p>
                {categoriasSel.length > 0 && totalSugeridosSrv > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                    {totalSugeridosSrv} coincide{totalSugeridosSrv !== 1 ? "n" : ""}
                  </span>
                )}
              </div>

              {/* Aviso amistoso si el taller NO tiene servicios en las categorías elegidas */}
              {categoriasSel.length > 0 &&
                totalSugeridosSrv === 0 &&
                serviciosOrdenados.length > 0 && (
                  <div className="glass-v2-soft p-3 text-xs text-white/80 flex items-start gap-2 border-amber-400/30">
                    <FaCheckCircle className="text-amber-300 mt-0.5 shrink-0" />
                    <span>
                      Este taller no tiene servicios marcados como{" "}
                      <b className="text-accent-light">
                        {categoriasSel.join(", ")}
                      </b>
                      , pero podés elegir cualquiera de sus servicios igual.
                      Después podés dejarle un mensaje al taller en el último
                      paso.
                    </span>
                  </div>
                )}

              {serviciosOrdenados.length === 0 ? (
                <div className="glass-v2-soft p-5 text-center">
                  <FaWrench className="mx-auto text-3xl text-white/35 mb-2" />
                  <p className="text-white font-semibold mb-1">
                    Este taller aún no publicó sus servicios
                  </p>
                  <p className="text-sm text-white/65 mb-4">
                    Igual podés reservar una <b className="text-accent-light">consulta general</b>.
                    El taller te confirmará el servicio y el precio cuando reciba tu solicitud.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setConsultaGeneral(true);
                      setServicio(null);
                      siguiente();
                    }}
                    className="btn-accent shine-on-hover"
                  >
                    <FaCheckCircle /> Solicitar consulta general
                  </button>
                </div>
              ) : (
                <>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {/* Opción de consulta general (siempre disponible) */}
                  <button
                    type="button"
                    onClick={() => {
                      setConsultaGeneral(true);
                      setServicio(null);
                      siguiente();
                    }}
                    className={`w-full glass-v2-soft p-4 text-left flex items-center gap-3 hover:border-accent/50 transition-all border-dashed ${
                      consultaGeneral ? "!border-accent ring-1 ring-accent/40" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent-light border border-accent/40 flex items-center justify-center shrink-0">
                      <FaCommentAlt />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-white">
                        Consulta general
                      </h4>
                      <p className="text-xs text-white/65">
                        ¿No estás seguro qué servicio necesitas? Pedí una
                        consulta y describí el problema. El taller te ayudará.
                      </p>
                    </div>
                    <div className="text-xs text-white/55 uppercase tracking-wider font-bold shrink-0">
                      A coordinar
                    </div>
                  </button>

                  {serviciosOrdenados.map((s, idx) => {
                    const esRec = categoriasSel.includes(s.categoria);
                    const esDivisor =
                      categoriasSel.length > 0 &&
                      totalSugeridosSrv > 0 &&
                      idx === totalSugeridosSrv &&
                      totalSugeridosSrv < serviciosOrdenados.length;
                    return (
                      <Fragment key={s.id}>
                        {esDivisor && (
                          <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/45 mt-3 mb-1">
                            Otros servicios del taller
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setServicio(s);
                            siguiente();
                          }}
                          className={`w-full glass-v2-soft p-4 text-left flex items-center gap-3 hover:border-accent/50 transition-all ${
                            servicio?.id === s.id
                              ? "!border-accent ring-1 ring-accent/40"
                              : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-white">
                                {s.nombre}
                              </h4>
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent-light border border-accent/30">
                                {s.categoria}
                              </span>
                              {esRec && (
                                <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            {s.descripcion && (
                              <p className="text-sm text-white/65 mt-0.5">
                                {s.descripcion}
                              </p>
                            )}
                            <div className="text-xs text-white/55 mt-1 inline-flex items-center gap-1.5">
                              <FaClock /> {s.duracionMinutos} min
                            </div>
                          </div>
                          <div className="text-xl font-extrabold text-gradient-accent shrink-0">
                            ${Number(s.precio).toFixed(2)}
                          </div>
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
                </>
              )}
            </>
          )}

          {paso === PASO_FECHA && (
            <>
              <p className="text-sm text-white/70">
                Elige cuándo. Las horas en rojo ya están ocupadas.
              </p>
              <div>
                <label className="label-dark inline-flex items-center gap-2">
                  <FaCalendarAlt className="text-accent-light" /> Fecha
                </label>
                <input
                  type="date"
                  min={today}
                  className="input-dark"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setHora("");
                  }}
                />
                {mecanico?.diasDisponibles && (
                  <p className="text-xs text-white/55 mt-1">
                    Días que atiende:{" "}
                    <span className="text-accent-light font-semibold">
                      {mecanico.diasDisponibles}
                    </span>
                  </p>
                )}
              </div>

              {fecha && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label-dark inline-flex items-center gap-2 !mb-0">
                      <FaClock className="text-accent-light" /> Hora
                    </label>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-white/55">
                      {horas.length - horasOcupadas.size} libres de {horas.length}
                    </span>
                  </div>
                  <div className="glass-v2-soft p-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {horas.map((h) => {
                      const ocupada = horasOcupadas.has(h);
                      const elegida = hora === h;
                      let cls;
                      if (ocupada) {
                        cls =
                          "bg-red-500/15 text-red-300/80 border-red-400/30 line-through cursor-not-allowed";
                      } else if (elegida) {
                        cls =
                          "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent";
                      } else {
                        cls =
                          "bg-emerald-400/10 text-emerald-200 border-emerald-400/30 hover:bg-emerald-400/20 hover:border-emerald-400/60";
                      }
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={ocupada}
                          onClick={() => setHora(h)}
                          className={`relative py-2 rounded-lg text-sm font-bold transition-all border ${cls}`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {paso === PASO_CONFIRMAR && (
            <>
              {/* Resumen */}
              <div className="glass-v2-soft p-4 space-y-2 text-sm">
                <Row label="Taller" value={mecanico?.usuario?.nombre} />
                {mecanico?.nombreLocal && (
                  <Row label="Local" value={mecanico.nombreLocal} />
                )}
                <Row
                  label="Servicio"
                  value={
                    consultaGeneral
                      ? "Consulta general · a coordinar con el taller"
                      : servicio?.nombre
                  }
                />
                <Row label="Cuándo" value={`${fecha} · ${hora}`} />
                {!consultaGeneral && (
                  <>
                    <Row
                      label="Duración"
                      value={`${servicio?.duracionMinutos} min`}
                    />
                    <Row
                      label="Precio"
                      value={`$${Number(servicio?.precio || 0).toFixed(2)}`}
                      highlight
                    />
                  </>
                )}
                {consultaGeneral && (
                  <Row
                    label="Precio"
                    value="A coordinar"
                  />
                )}
                {categoriasSel.length > 0 && (
                  <div className="pt-2 mt-1 border-t border-white/10">
                    <div className="text-xs uppercase tracking-wider font-bold text-white/55 mb-1.5">
                      Trabajo solicitado
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {categoriasSel.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent-light border border-accent/30"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Comentario obligatoriamente visible, no obligatorio de llenar */}
              <div>
                <label className="label-dark inline-flex items-center gap-2">
                  <FaCommentAlt className="text-accent-light" /> Mensaje para el
                  taller{" "}
                  <span className="text-white/45 text-xs font-normal normal-case tracking-normal">
                    · opcional, pero ayuda mucho
                  </span>
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  className="input-dark"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Cuéntale brevemente al taller qué le pasa a tu vehículo, qué notaste, desde cuándo, etc."
                />
                <div className="text-[10px] text-white/45 text-right mt-1">
                  {descripcion.length}/500
                </div>
              </div>

              <div className="text-xs text-white/55 flex items-start gap-2">
                <FaCheckCircle className="text-emerald-300 mt-0.5 shrink-0" />
                Tu solicitud se enviará al taller. Él decidirá si la acepta o
                rechaza. Te avisaremos cuando responda.
              </div>
            </>
          )}
        </div>

        {/* Footer con navegación */}
        <div className="sticky bottom-0 z-10 px-5 sm:px-6 py-3 border-t border-white/10 bg-gradient-to-r from-zinc-950/80 to-zinc-900/80 backdrop-blur flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={atras}
            disabled={paso === 1}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white/85 bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <FaArrowLeft /> Atrás
          </button>

          {paso < TOTAL ? (
            <button
              type="button"
              onClick={siguiente}
              disabled={!puedeAvanzar}
              className="btn-accent shine-on-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {paso === 1 && categoriasSel.length === 0
                ? "Continuar sin categoría"
                : "Siguiente"}{" "}
              <FaArrowRight />
            </button>
          ) : (
            <button
              type="button"
              onClick={confirmar}
              disabled={mut.isPending}
              className="btn-accent shine-on-hover"
            >
              <FaCheckCircle />{" "}
              {mut.isPending ? "Enviando..." : "Confirmar cita"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wider font-bold text-white/55">
        {label}
      </span>
      <span
        className={`font-semibold truncate ${
          highlight
            ? "text-2xl font-extrabold text-gradient-accent"
            : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
