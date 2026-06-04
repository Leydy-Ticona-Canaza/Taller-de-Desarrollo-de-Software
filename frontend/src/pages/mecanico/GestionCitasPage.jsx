import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FaList, FaCalendarAlt } from "react-icons/fa";
import { citasMecanico, cambiarEstadoCita } from "../../api/citas.api";
import CitaCard from "../../components/CitaCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import CalendarioCitas from "../../components/CalendarioCitas.jsx";
import DiaCitasPanel from "../../components/DiaCitasPanel.jsx";
import { parseFecha, ymd } from "../../utils/citas";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";

const FILTROS = [
  { v: "todas", t: "Todas" },
  { v: "pendiente", t: "Pendientes" },
  { v: "aceptada", t: "Aceptadas" },
  { v: "en_proceso", t: "En proceso" },
  { v: "finalizada", t: "Finalizadas" },
  { v: "cancelada", t: "Canceladas" },
  { v: "rechazada", t: "Rechazadas" },
];

const MENSAJES_ESTADO = {
  aceptada: {
    title: "Cita aceptada",
    message: "Confirmaste la cita. El cliente recibirá el aviso.",
    emoji: "✅",
  },
  rechazada: {
    title: "Cita rechazada",
    message: "El cliente sabrá que no podrás atenderlo este día.",
    emoji: "❌",
  },
  en_proceso: {
    title: "Servicio iniciado",
    message: "¡Manos a la obra! Cuando termines marca la cita como finalizada.",
    emoji: "🔧",
  },
  finalizada: {
    title: "Servicio finalizado",
    message: "Trabajo completado. El cliente podrá calificarte ahora.",
    emoji: "🎉",
  },
};

export default function GestionCitasPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const success = useSuccess();
  const [filtro, setFiltro] = useState("todas");
  const [modo, setModo] = useState("lista");
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date());

  const { data: citas = [], isLoading } = useQuery({
    queryKey: ["mec-citas"],
    queryFn: citasMecanico,
  });

  const mut = useMutation({
    mutationFn: ({ id, estado }) => cambiarEstadoCita(id, estado),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["mec-citas"] });
      qc.invalidateQueries({ queryKey: ["mec-dashboard"] });
      const meta = MENSAJES_ESTADO[vars.estado];
      if (meta) success(meta);
    },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.message || "Error"),
  });

  async function cambiarEstadoConfirmado(c, estado) {
    const labels = {
      aceptada: { title: "¿Aceptar esta cita?", confirm: "Sí, aceptar", tipo: "wrench" },
      rechazada: { title: "¿Rechazar esta cita?", confirm: "Sí, rechazar", tipo: "danger" },
      en_proceso: { title: "¿Iniciar el servicio?", confirm: "Sí, iniciar", tipo: "wrench" },
      finalizada: { title: "¿Finalizar el servicio?", confirm: "Sí, finalizar", tipo: "question", colorBoton: "success" },
    };
    const l = labels[estado];
    const ok = await confirm({
      title: l.title,
      message: `Cliente: ${c.cliente?.nombre || "—"}\nServicio: ${c.nombreServicio || c.servicio?.nombre}\nFecha: ${c.fecha} ${c.hora}`,
      confirmText: l.confirm,
      cancelText: "Cancelar",
      tipo: l.tipo,
      colorBoton: l.colorBoton,
    });
    if (ok) mut.mutate({ id: c.id, estado });
  }

  const filtradas = useMemo(
    () =>
      filtro === "todas" ? citas : citas.filter((c) => c.estado === filtro),
    [citas, filtro],
  );

  const citasDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    const key = ymd(diaSeleccionado);
    return citas.filter((c) => c.fecha === key);
  }, [citas, diaSeleccionado]);

  function accionesPara(c) {
    const acciones = [];
    if (c.estado === "pendiente") {
      acciones.push(
        <button
          key="ace"
          onClick={() => cambiarEstadoConfirmado(c, "aceptada")}
          className="btn-success text-sm py-1.5"
        >
          Aceptar
        </button>,
        <button
          key="rec"
          onClick={() => cambiarEstadoConfirmado(c, "rechazada")}
          className="btn-danger text-sm py-1.5"
        >
          Rechazar
        </button>,
      );
    } else if (c.estado === "aceptada") {
      acciones.push(
        <button
          key="ini"
          onClick={() => cambiarEstadoConfirmado(c, "en_proceso")}
          className="btn-primary text-sm py-1.5"
        >
          Iniciar
        </button>,
      );
    } else if (c.estado === "en_proceso") {
      acciones.push(
        <button
          key="fin"
          onClick={() => cambiarEstadoConfirmado(c, "finalizada")}
          className="btn-success text-sm py-1.5"
        >
          Finalizar
        </button>,
      );
    }
    return acciones.length ? acciones : null;
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

    <div className="relative max-w-6xl mx-auto px-3 sm:px-4 py-6 space-y-5 animate-fade-in-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <span className="chip-premium">
            <FaCalendarAlt /> Agenda
          </span>
          <h1 className="cliente-headline text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)] mt-2">
            Gestión de <span className="text-gradient-accent">citas</span>
          </h1>
          <p className="text-sm text-white/65 mt-1">
            Revisa tus citas en lista o en el calendario.
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
            onClick={() => setModo("calendario")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-all ${
              modo === "calendario"
                ? "bg-white/95 shadow text-zinc-900"
                : "text-white/70 hover:text-white"
            }`}
          >
            <FaCalendarAlt /> Calendario
          </button>
        </div>
      </div>

      {modo === "lista" ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {FILTROS.map((f) => (
              <button
                key={f.v}
                onClick={() => setFiltro(f.v)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all ${
                  filtro === f.v
                    ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                    : "bg-white/5 border-white/15 text-white/85 hover:border-accent/50 hover:bg-white/10 backdrop-blur"
                }`}
              >
                {f.t}
              </button>
            ))}
          </div>

          {filtradas.length === 0 ? (
            <div className="glass-v2 text-center text-white/65 py-10">
              No hay citas en esta categoría.
            </div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((c) => (
                <CitaCard
                  key={c.id}
                  cita={c}
                  perspective="mecanico"
                  actions={accionesPara(c)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-4">
          <CalendarioCitas
            citas={citas}
            selectedDate={diaSeleccionado}
            onDayClick={(d) => setDiaSeleccionado(d)}
          />
          <DiaCitasPanel
            fecha={diaSeleccionado}
            citas={citasDia}
            perspective="mecanico"
            renderActions={accionesPara}
          />
        </div>
      )}
    </div>
    </div>
  );
}
