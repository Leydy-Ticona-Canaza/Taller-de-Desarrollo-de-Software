import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaList,
  FaCalendarAlt,
  FaBell,
  FaMapMarkedAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { misCitas, cancelarCita } from "../../api/citas.api";
import { crearResena } from "../../api/resenas.api";
import CitaCard from "../../components/CitaCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { StarPicker } from "../../components/StarRating.jsx";
import CalendarioCitas from "../../components/CalendarioCitas.jsx";
import DiaCitasPanel from "../../components/DiaCitasPanel.jsx";
import {
  combinarFechaHora,
  proximaCita,
  tiempoRestante,
  ymd,
} from "../../utils/citas";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";

export default function MisCitasPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const success = useSuccess();
  const [resenando, setResenando] = useState(null);
  const [resenaForm, setResenaForm] = useState({ calificacion: 5, comentario: "" });
  const [modo, setModo] = useState("lista");
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date());

  const { data: citas = [], isLoading } = useQuery({
    queryKey: ["mis-citas"],
    queryFn: misCitas,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelarCita,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mis-citas"] });
      success({
        title: "Cita cancelada",
        message: "Tu cita ha sido cancelada correctamente.",
        emoji: "🛑",
      });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || e.response?.data?.message || "Error al cancelar"),
  });

  const resenaMutation = useMutation({
    mutationFn: crearResena,
    onSuccess: () => {
      setResenando(null);
      setResenaForm({ calificacion: 5, comentario: "" });
      qc.invalidateQueries({ queryKey: ["mis-citas"] });
      success({
        title: "¡Gracias por tu reseña!",
        message: "Tu opinión ayuda a otros conductores a elegir mejor.",
        emoji: "⭐",
      });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || e.response?.data?.message || "Error al enviar reseña"),
  });

  const proxima = useMemo(() => proximaCita(citas), [citas]);

  const citasDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    const key = ymd(diaSeleccionado);
    return citas.filter((c) => c.fecha === key);
  }, [citas, diaSeleccionado]);

  function accionesPara(c) {
    const acciones = [];
    if (c.estado === "pendiente" || c.estado === "aceptada") {
      acciones.push(
        <button
          key="cancelar"
          onClick={async () => {
            const ok = await confirm({
              title: "¿Cancelar esta cita?",
              message: `Vas a cancelar:\n\n${c.nombreServicio || c.servicio?.nombre}\n${c.fecha} a las ${c.hora}\n\nEsta acción no se puede deshacer.`,
              confirmText: "Sí, cancelar cita",
              cancelText: "No, mantenerla",
              tipo: "cancel",
            });
            if (ok) cancelMutation.mutate(c.id);
          }}
          className="btn-danger text-sm py-1.5"
        >
          Cancelar
        </button>,
      );
    }
    if (c.estado === "finalizada" && !c.resena) {
      acciones.push(
        <button
          key="resena"
          onClick={() => setResenando(c)}
          className="btn-accent text-sm py-1.5"
        >
          Calificar
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
            Mis <span className="text-gradient-accent">citas</span>
          </h1>
          <p className="text-sm text-white/65 mt-1">
            Visualiza tus citas como lista o en el calendario.
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

      {/* Recordatorio de próxima cita */}
      {proxima && (
        <ProximaCitaBanner
          cita={proxima}
          onVerMapa={() => {
            if (proxima.mecanico?.id) navigate(`/mecanico/${proxima.mecanico.id}`);
          }}
        />
      )}

      {modo === "lista" ? (
        citas.length === 0 ? (
          <div className="glass-v2 text-center text-white/70 py-10">
            Aún no tienes citas reservadas.
          </div>
        ) : (
          <div className="space-y-3">
            {citas.map((c) => (
              <CitaCard
                key={c.id}
                cita={c}
                perspective="cliente"
                actions={accionesPara(c)}
              />
            ))}
          </div>
        )
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
            perspective="cliente"
            renderActions={accionesPara}
          />
        </div>
      )}

      {resenando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 animate-fade-in">
          <div className="glass-v2 w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-extrabold mb-2 text-white">
              Calificar servicio
            </h3>
            <p className="text-sm text-white/70 mb-3">
              {resenando.nombreServicio} con{" "}
              <span className="text-accent-light font-semibold">
                {resenando.mecanico?.usuario?.nombre}
              </span>
            </p>
            <div className="mb-3">
              <label className="label-dark">Calificación</label>
              <StarPicker
                value={resenaForm.calificacion}
                onChange={(n) =>
                  setResenaForm({ ...resenaForm, calificacion: n })
                }
              />
            </div>
            <div className="mb-4">
              <label className="label-dark">Comentario (opcional)</label>
              <textarea
                rows={4}
                className="input-dark"
                value={resenaForm.comentario}
                onChange={(e) =>
                  setResenaForm({ ...resenaForm, comentario: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
              <button
                className="btn-accent flex-1 shine-on-hover"
                onClick={() =>
                  resenaMutation.mutate({
                    citaId: resenando.id,
                    ...resenaForm,
                  })
                }
                disabled={resenaMutation.isPending}
              >
                Enviar
              </button>
              <button
                className="px-5 py-2.5 rounded-xl font-semibold text-white/85 bg-white/5 border border-white/15 hover:bg-white/10 transition-all"
                onClick={() => setResenando(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function ProximaCitaBanner({ cita, onVerMapa }) {
  const dt = combinarFechaHora(cita.fecha, cita.hora);
  const cuando = tiempoRestante(dt);
  return (
    <div className="glass-v2 relative overflow-hidden text-white p-5">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/30 rounded-full blur-3xl animate-blob" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-zinc-700/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: "3s" }} />

      <div className="relative flex items-start gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl shadow-glow animate-pulse">
          <FaBell />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-white/75 font-bold">
            Tu próxima cita
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">
            {cita.nombreServicio || cita.servicio?.nombre}
          </h3>
          <div className="mt-1 text-white/90 text-sm">
            <strong>{cuando || cita.fecha}</strong> a las{" "}
            <strong>{cita.hora}</strong> · {cita.mecanico?.usuario?.nombre}
          </div>
        </div>
        {cita.mecanico?.latitud != null && (
          <button
            onClick={onVerMapa}
            className="btn-accent text-sm shrink-0"
          >
            <FaMapMarkedAlt /> Ver taller
          </button>
        )}
      </div>
    </div>
  );
}
