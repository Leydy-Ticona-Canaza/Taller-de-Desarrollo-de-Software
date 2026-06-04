import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaClock,
  FaWrench,
  FaArrowLeft,
  FaCheckCircle,
  FaStore,
  FaUser,
} from "react-icons/fa";
import { detalleMecanico } from "../../api/mecanicos.api";
import { crearCita, horariosOcupados } from "../../api/citas.api";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";

function generarHoras(inicio = "08:00", fin = "18:00") {
  const horas = [];
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf] = fin.split(":").map(Number);
  for (let h = hi; h <= hf - 1; h++) {
    horas.push(`${String(h).padStart(2, "0")}:00`);
    horas.push(`${String(h).padStart(2, "0")}:30`);
  }
  return horas;
}

export default function ReservarCitaPage() {
  const { mecanicoId, servicioId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const success = useSuccess();

  const { data: mecanico, isLoading } = useQuery({
    queryKey: ["mecanico", mecanicoId],
    queryFn: () => detalleMecanico(mecanicoId),
  });

  const servicio = useMemo(
    () => mecanico?.servicios?.find((s) => s.id === parseInt(servicioId)),
    [mecanico, servicioId]
  );

  const [form, setForm] = useState({
    fecha: "",
    hora: "",
    descripcionProblema: "",
  });

  const horas = useMemo(
    () => generarHoras(mecanico?.horarioInicio, mecanico?.horarioFin),
    [mecanico]
  );

  // Disponibilidad del día seleccionado
  const { data: ocupadasData } = useQuery({
    queryKey: ["ocupadas", mecanicoId, form.fecha],
    queryFn: () => horariosOcupados(mecanicoId, form.fecha),
    enabled: !!mecanicoId && !!form.fecha,
  });
  const horasOcupadas = new Set(ocupadasData?.horasOcupadas || []);

  const mutation = useMutation({
    mutationFn: crearCita,
    onSuccess: async () => {
      await success({
        title: "¡Cita reservada!",
        message:
          "Tu solicitud fue enviada al mecánico. Te avisaremos cuando la confirme.",
        emoji: "🔧",
        actionLabel: "Ver mis citas",
      });
      navigate("/mis-citas");
    },
    onError: (e) => {
      toast.error(e.response?.data?.detail || e.response?.data?.message || "Error al crear cita");
    },
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fecha || !form.hora) {
      toast.error("Selecciona fecha y hora");
      return;
    }
    const ok = await confirm({
      title: "¿Confirmar la reserva?",
      message: `Vas a reservar:\n\n${servicio.nombre}\nMecánico: ${mecanico.usuario?.nombre}\nFecha: ${form.fecha} a las ${form.hora}\nPrecio: $${Number(servicio.precio).toFixed(2)}`,
      confirmText: "Sí, reservar",
      cancelText: "Revisar datos",
      tipo: "wrench",
    });
    if (!ok) return;
    mutation.mutate({
      mecanicoId: parseInt(mecanicoId),
      servicioId: parseInt(servicioId),
      ...form,
    });
  }

  if (isLoading) return <LoadingSpinner />;
  if (!servicio || !mecanico)
    return (
      <div className="bg-cliente-glass min-h-full text-white">
        <span className="mesh-orb o1" aria-hidden />
        <span className="mesh-orb o2" aria-hidden />
        <div className="relative max-w-2xl mx-auto px-4 py-8">
          <div className="glass-v2 text-center text-white/70 p-6">
            Servicio no encontrado.
          </div>
        </div>
      </div>
    );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in-up">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-white/75 hover:text-accent-light text-sm px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur transition-all"
        >
          <FaArrowLeft /> Volver
        </button>

        <div>
          <span className="chip-premium">
            <FaCalendarAlt /> Nueva reserva
          </span>
          <h1 className="cliente-headline text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)] mt-2">
            Reservar <span className="text-gradient-accent">cita</span>
          </h1>
        </div>

        {/* Resumen del servicio */}
        <div className="glass-v2 glass-v2-iridescent p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold text-accent-light">
            <FaCheckCircle /> Resumen de tu reserva
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent-light border border-accent/40 flex items-center justify-center shrink-0">
                <FaUser />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                  Mecánico
                </div>
                <div className="font-semibold text-white truncate">
                  {mecanico.usuario?.nombre}
                </div>
              </div>
            </div>
            {mecanico.nombreLocal && (
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent-light border border-accent/40 flex items-center justify-center shrink-0">
                  <FaStore />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                    Local
                  </div>
                  <div className="font-semibold text-white truncate">
                    {mecanico.nombreLocal}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 mt-2 border-t border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/55 mb-1">
              Servicio
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-extrabold text-white text-lg">
                  {servicio.nombre}
                </div>
                {servicio.descripcion && (
                  <div className="text-sm text-white/65 mt-0.5">
                    {servicio.descripcion}
                  </div>
                )}
                <div className="text-xs text-white/55 mt-1 inline-flex items-center gap-1.5">
                  <FaClock /> {servicio.duracionMinutos} min
                </div>
              </div>
              <div className="shrink-0 text-2xl font-extrabold text-gradient-accent">
                ${Number(servicio.precio).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="glass-v2 p-5 sm:p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FaWrench className="text-accent-light" /> Elige cuándo
          </h2>

          <div>
            <label className="label-dark inline-flex items-center gap-2">
              <FaCalendarAlt className="text-accent-light" /> Elige la fecha
            </label>
            <input
              type="date"
              min={today}
              required
              className="input-dark"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value, hora: "" })}
            />
            {mecanico.diasDisponibles && (
              <p className="text-xs text-white/55 mt-1">
                Días que atiende el taller:{" "}
                <span className="text-accent-light font-semibold">
                  {mecanico.diasDisponibles}
                </span>
              </p>
            )}
          </div>

          {/* Grid visual de horarios libres/ocupados */}
          <div>
            <label className="label-dark inline-flex items-center gap-2">
              <FaClock className="text-accent-light" /> Elige una hora
              {form.fecha && (
                <span className="ml-auto text-[10px] uppercase tracking-wider font-bold text-white/55">
                  {horas.length - horasOcupadas.size} libres de {horas.length}
                </span>
              )}
            </label>

            {!form.fecha ? (
              <div className="glass-v2-soft p-4 text-center text-sm text-white/65">
                Selecciona primero una fecha para ver los horarios disponibles.
              </div>
            ) : (
              <>
                {/* Leyenda */}
                <div className="flex items-center gap-3 mb-2 text-[10px] uppercase tracking-wider font-bold text-white/60">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
                    Libre
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-accent" />
                    Tu selección
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    Ocupado
                  </span>
                </div>
                <div className="glass-v2-soft p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {horas.map((h) => {
                    const ocupada = horasOcupadas.has(h);
                    const elegida = form.hora === h;
                    const base =
                      "relative py-2 rounded-lg text-sm font-bold transition-all border";
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
                        onClick={() => setForm({ ...form, hora: h })}
                        className={`${base} ${cls}`}
                        title={
                          ocupada
                            ? "Ya hay otra cita en este horario"
                            : "Disponible"
                        }
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="label-dark">Describe el problema</label>
            <textarea
              rows={4}
              className="input-dark"
              placeholder="Cuenta al mecánico qué le pasa a tu vehículo..."
              value={form.descripcionProblema}
              onChange={(e) =>
                setForm({ ...form, descripcionProblema: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-accent flex-1 shine-on-hover text-base py-3"
              disabled={mutation.isPending}
            >
              <FaCheckCircle />{" "}
              {mutation.isPending ? "Reservando..." : "Confirmar reserva"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl font-semibold text-white/85 bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
