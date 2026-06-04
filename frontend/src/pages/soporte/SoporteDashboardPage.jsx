import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaTools,
  FaCommentDots,
  FaUserPlus,
  FaKey,
  FaLifeRing,
  FaShieldAlt,
  FaArrowRight,
  FaStore,
} from "react-icons/fa";
import { soporteDashboard } from "../../api/soporte.api";
import StatsCard from "../../components/StatsCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import useTilt from "../../hooks/useTilt";

export default function SoporteDashboardPage() {
  const tiltHero = useTilt({ max: 4 });
  const tiltA = useTilt({ max: 6 });
  const tiltB = useTilt({ max: 6 });
  const tiltC = useTilt({ max: 6 });

  const { data, isLoading } = useQuery({
    queryKey: ["soporte-dashboard"],
    queryFn: soporteDashboard,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-fade-in-up">
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
              <linearGradient id="sdline" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#5be1ff" />
              </linearGradient>
            </defs>
            <path d="M0,150 C200,80 400,180 600,90 L800,140 L800,200 L0,200 Z" fill="url(#sdline)" />
          </svg>

          <div className="relative flex items-start gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-violet-400/40 via-cyan-400/30 to-accent/30 blur-xl opacity-70" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-2xl ring-2 ring-white/30 text-3xl sm:text-4xl">
                <FaLifeRing />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span className="chip-premium">
                <FaShieldAlt /> Centro de soporte
              </span>
              <h1 className="cliente-headline text-white drop-shadow mt-3">
                Soporte <span className="text-gradient-accent">técnico</span>
              </h1>
              <p className="text-sm text-white/70 mt-1.5">
                Ayuda a clientes y mecánicos. Modera reseñas inapropiadas.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          <StatsCard
            icon={<FaUsers />}
            label="Clientes"
            value={data?.totalClientes ?? 0}
            color="primary"
          />
          <StatsCard
            icon={<FaTools />}
            label="Mecánicos"
            value={data?.totalMecanicos ?? 0}
            color="accent"
          />
          <StatsCard
            icon={<FaCommentDots />}
            label="Reseñas totales"
            value={data?.totalResenas ?? 0}
            color="success"
          />
          <StatsCard
            icon={<FaCommentDots />}
            label="Últ. 7 días"
            value={data?.resenasRecientes ?? 0}
            color="warning"
          />
        </div>

        {/* Acciones rápidas */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/soporte/usuarios"
            ref={tiltA.ref}
            {...tiltA.handlers}
            className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-6 group"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <div className="relative flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-cyan-400/10 text-cyan-300 border border-cyan-300/40 flex items-center justify-center text-2xl shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <FaUserPlus />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-lg text-white">
                  Gestión de usuarios
                </h3>
                <p className="text-sm text-white/65 mt-1">
                  Crear cuentas y activar/desactivar clientes y mecánicos.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent-light group-hover:gap-2 transition-all">
                  Entrar <FaArrowRight className="text-xs" />
                </div>
              </div>
            </div>
          </Link>
          <Link
            to="/soporte/mecanicos"
            ref={tiltC.ref}
            {...tiltC.handlers}
            className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-6 group"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <div className="relative flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-emerald-400/10 text-emerald-300 border border-emerald-300/40 flex items-center justify-center text-2xl shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <FaStore />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-lg text-white">
                  Asistencia a talleres
                </h3>
                <p className="text-sm text-white/65 mt-1">
                  Busca por DNI, local o nombre. Suspender / reactivar cuenta o
                  restablecer contraseña.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent-light group-hover:gap-2 transition-all">
                  Entrar <FaArrowRight className="text-xs" />
                </div>
              </div>
            </div>
          </Link>
          <Link
            to="/soporte/resenas"
            ref={tiltB.ref}
            {...tiltB.handlers}
            className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-6 group"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent/20 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <div className="relative flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 text-accent-light border border-accent/40 flex items-center justify-center text-2xl shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <FaCommentDots />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-lg text-white">
                  Moderación de reseñas
                </h3>
                <p className="text-sm text-white/65 mt-1">
                  Elimina reseñas inapropiadas u ofensivas hacia los mecánicos.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent-light group-hover:gap-2 transition-all">
                  Entrar <FaArrowRight className="text-xs" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Aviso jerarquía */}
        <div className="glass-v2 p-5 flex items-start gap-3 border-violet-400/30">
          <div className="w-11 h-11 rounded-2xl bg-violet-400/20 text-violet-300 border border-violet-400/40 flex items-center justify-center shrink-0">
            <FaShieldAlt />
          </div>
          <div className="text-sm text-white/80 leading-relaxed flex-1 min-w-0">
            <p className="font-extrabold text-white mb-1">
              Recordatorio de jerarquía
            </p>
            <p>
              Como soporte tienes permisos sobre <b className="text-accent-light">clientes y mecánicos</b>.
              Los administradores están por encima en la jerarquía: no puedes
              crear, editar, eliminar ni resetear contraseñas de administradores.
              Si necesitas modificar la cuenta de un admin, contacta con otro
              administrador.
            </p>
          </div>
        </div>

        {/* Capacidades */}
        <div className="glass-v2 p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-3">
            <FaShieldAlt className="text-accent-light" />
            ¿Qué puede hacer un agente de soporte?
          </h2>
          <ul className="space-y-2.5 text-sm text-white/80">
            {[
              { icon: <FaUserPlus />, t: "Crear nuevos usuarios de tipo cliente o mecánico." },
              { icon: <FaKey />,      t: "Restablecer la contraseña de un cliente o mecánico cuando lo solicite." },
              { icon: <FaCommentDots />, t: "Eliminar reseñas con lenguaje ofensivo, falsas o irrelevantes." },
              { icon: <FaUsers />,    t: "Activar o desactivar cuentas problemáticas (sin eliminarlas)." },
              { icon: <FaTools />,    t: "Editar datos básicos (nombre y teléfono) cuando el usuario tenga problemas para hacerlo." },
            ].map((it, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent-light border border-accent/30 flex items-center justify-center shrink-0 text-sm mt-0.5">
                  {it.icon}
                </div>
                <span>{it.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
