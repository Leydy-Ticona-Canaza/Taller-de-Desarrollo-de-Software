import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaClock,
  FaCheckCircle,
  FaStar,
  FaWrench,
  FaExclamationTriangle,
  FaTachometerAlt,
} from "react-icons/fa";
import { dashboardMecanico } from "../../api/mecanicos.api";
import { citasMecanico, cambiarEstadoCita } from "../../api/citas.api";
import StatsCard from "../../components/StatsCard.jsx";
import CitaCard from "../../components/CitaCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import useTilt from "../../hooks/useTilt";

export default function DashboardPage() {
  const qc = useQueryClient();
  const tiltHero = useTilt({ max: 4 });

  const { data: stats, isLoading: l1 } = useQuery({
    queryKey: ["mec-dashboard"],
    queryFn: dashboardMecanico,
  });
  const { data: citas = [], isLoading: l2 } = useQuery({
    queryKey: ["mec-citas"],
    queryFn: citasMecanico,
  });

  const estadoMutation = useMutation({
    mutationFn: ({ id, estado }) => cambiarEstadoCita(id, estado),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["mec-citas"] });
      qc.invalidateQueries({ queryKey: ["mec-dashboard"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const pendientes = citas.filter((c) => c.estado === "pendiente");

  if (l1 || l2) return <LoadingSpinner />;

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        {/* HERO */}
        <section
          ref={tiltHero.ref}
          {...tiltHero.handlers}
          className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-6 sm:p-8"
        >
          <svg
            aria-hidden
            className="absolute inset-0 w-full h-full opacity-[0.10] pointer-events-none"
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="dline" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#5be1ff" />
                <stop offset="1" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <path d="M0,150 C200,80 400,180 600,90 L800,140 L800,200 L0,200 Z" fill="url(#dline)" />
          </svg>

          <div className="relative">
            <span className="chip-premium">
              <FaTachometerAlt /> Panel mecánico
            </span>
            <h1 className="cliente-headline text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)] mt-3">
              Dashboard
            </h1>
            <p className="text-sm text-white/70 mt-1.5">
              Tu resumen del día. Acepta solicitudes, gestiona citas y crece tu reputación.
            </p>
          </div>
        </section>

        {/* Aviso de cuenta pendiente */}
        {stats && !stats.aprobado && (
          <div className="glass-v2 p-5 flex items-start gap-3 border-amber-400/30">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
              <FaExclamationTriangle />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-amber-300">
                Cuenta pendiente de aprobación
              </p>
              <p className="text-sm text-white/75 mt-1">
                Tu perfil está en revisión. Una vez aprobado por el administrador
                podrás aparecer en las búsquedas de los clientes.
              </p>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          <StatsCard
            icon={<FaClock />}
            label="Pendientes"
            value={stats?.citasPendientes ?? 0}
            color="warning"
          />
          <StatsCard
            icon={<FaWrench />}
            label="Aceptadas"
            value={stats?.citasAceptadas ?? 0}
            color="primary"
          />
          <StatsCard
            icon={<FaCheckCircle />}
            label="Finalizadas"
            value={stats?.citasFinalizadas ?? 0}
            color="success"
          />
          <StatsCard
            icon={<FaStar />}
            label="Calificación"
            value={(stats?.calificacionPromedio ?? 0).toFixed(1)}
            color="accent"
          />
        </div>

        {/* Citas pendientes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FaClock className="text-accent-light" />
            <h2 className="text-xl font-extrabold text-white">
              Citas pendientes
            </h2>
            {pendientes.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-accent/20 text-accent-light text-xs font-bold border border-accent/40">
                {pendientes.length}
              </span>
            )}
          </div>
          {pendientes.length === 0 ? (
            <div className="glass-v2 text-center text-white/65 py-10">
              <FaCheckCircle className="mx-auto text-3xl text-emerald-400/70 mb-2" />
              No tienes solicitudes pendientes. ¡Buen trabajo!
            </div>
          ) : (
            <div className="space-y-3">
              {pendientes.map((c) => (
                <CitaCard
                  key={c.id}
                  cita={c}
                  perspective="mecanico"
                  actions={[
                    <button
                      key="ace"
                      className="btn-success text-sm py-1.5"
                      onClick={() =>
                        estadoMutation.mutate({ id: c.id, estado: "aceptada" })
                      }
                    >
                      Aceptar
                    </button>,
                    <button
                      key="rec"
                      className="btn-danger text-sm py-1.5"
                      onClick={() =>
                        estadoMutation.mutate({ id: c.id, estado: "rechazada" })
                      }
                    >
                      Rechazar
                    </button>,
                  ]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
