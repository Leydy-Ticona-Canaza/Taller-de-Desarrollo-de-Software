import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaTools,
  FaCalendarAlt,
  FaClipboardCheck,
  FaArrowRight,
  FaShieldAlt,
  FaUserShield,
} from "react-icons/fa";
import { adminDashboard } from "../../api/admin.api";
import StatsCard from "../../components/StatsCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import useTilt from "../../hooks/useTilt";

export default function AdminDashboardPage() {
  const tiltHero = useTilt({ max: 4 });
  const tiltA = useTilt({ max: 6 });
  const tiltB = useTilt({ max: 6 });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminDashboard,
  });

  if (isLoading) return <LoadingSpinner />;

  const pendientes = data?.pendientesAprobacion ?? 0;

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
              <linearGradient id="adline" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#f43f5e" />
                <stop offset="1" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <path d="M0,150 C200,80 400,180 600,90 L800,140 L800,200 L0,200 Z" fill="url(#adline)" />
          </svg>

          <div className="relative flex items-start gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-rose-400/40 via-accent/30 to-cyan-400/30 blur-xl opacity-70" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-2xl ring-2 ring-white/30 text-3xl sm:text-4xl">
                <FaUserShield />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span className="chip-premium">
                <FaShieldAlt /> Panel de control
              </span>
              <h1 className="cliente-headline text-white drop-shadow mt-3">
                Administración
              </h1>
              <p className="text-sm text-white/70 mt-1.5">
                Gestiona usuarios, supervisa mecánicos y aprueba nuevas cuentas.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          <StatsCard
            icon={<FaUsers />}
            label="Usuarios totales"
            value={data?.totalUsuarios ?? 0}
            color="primary"
          />
          <StatsCard
            icon={<FaTools />}
            label="Mecánicos"
            value={data?.totalMecanicos ?? 0}
            color="accent"
          />
          <StatsCard
            icon={<FaCalendarAlt />}
            label="Citas totales"
            value={data?.totalCitas ?? 0}
            color="success"
          />
          <StatsCard
            icon={<FaClipboardCheck />}
            label="Por aprobar"
            value={pendientes}
            color="warning"
          />
        </div>

        {/* Acciones rápidas */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/admin/usuarios"
            ref={tiltA.ref}
            {...tiltA.handlers}
            className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-6 group"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <div className="relative flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-cyan-400/10 text-cyan-300 border border-cyan-300/40 flex items-center justify-center text-2xl shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <FaUsers />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-lg text-white">
                  Gestión de usuarios
                </h3>
                <p className="text-sm text-white/65 mt-1">
                  Crea, edita y elimina cuentas. Activa o desactiva usuarios.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent-light group-hover:gap-2 transition-all">
                  Entrar <FaArrowRight className="text-xs" />
                </div>
              </div>
            </div>
          </Link>
          <Link
            to="/admin/mecanicos"
            ref={tiltB.ref}
            {...tiltB.handlers}
            className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-6 group"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent/20 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <div className="relative flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 text-accent-light border border-accent/40 flex items-center justify-center text-2xl shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <FaClipboardCheck />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-lg text-white">
                  Aprobación de mecánicos
                </h3>
                <p className="text-sm text-white/65 mt-1">
                  Revisa perfiles pendientes con toda su información: DNI, taller, fotos.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent-light group-hover:gap-2 transition-all">
                  Revisar
                  {pendientes > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-400/25 text-amber-300 text-[10px] font-bold border border-amber-400/40">
                      {pendientes}
                    </span>
                  )}
                  <FaArrowRight className="text-xs ml-1" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
