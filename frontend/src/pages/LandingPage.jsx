import { Link } from "react-router-dom";
import {
  FaSearch,
  FaCalendarCheck,
  FaTools,
  FaUserShield,
  FaArrowRight,
  FaBolt,
  FaCarCrash,
  FaTachometerAlt,
  FaCog,
  FaUsers,
  FaUserCog,
  FaLifeRing,
  FaCommentDots,
  FaUserCircle,
  FaSignInAlt,
  FaUserPlus,
  FaCalendarAlt,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";

function AccionCard({ to, icon, title, text, primary, index }) {
  return (
    <Link
      to={to}
      className={`group relative flex flex-col h-full min-h-[180px] rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
        primary
          ? "bg-gradient-to-br from-accent to-accent-dark text-white border-accent-light/40 shadow-glow-accent hover:shadow-[0_18px_45px_-10px_rgba(245,158,11,0.7)] animate-pulse-glow"
          : "bg-white/95 text-slate-800 border-white/40 shadow-card hover:shadow-glow hover:border-primary/40"
      }`}
    >
      {/* Reflejo sutil superior */}
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
          primary ? "bg-white/40" : "bg-gradient-to-r from-transparent via-white/80 to-transparent"
        }`}
      />
      {/* Brillo que se desliza en hover */}
      <span
        className="pointer-events-none absolute -inset-y-2 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent rotate-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-[450%] transition-all duration-700 ease-out"
        aria-hidden
      />

      {/* Cabecera: icono + número (alineados a la misma altura) */}
      <div className="flex items-start justify-between gap-3 relative">
        <div
          className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${
            primary
              ? "bg-white/20 text-white ring-1 ring-white/30 backdrop-blur"
              : "bg-gradient-to-br from-primary-softer to-white text-primary ring-1 ring-primary/10"
          }`}
        >
          {icon}
        </div>
        <span
          className={`text-[10px] font-bold tracking-[0.2em] leading-none mt-1 ${
            primary ? "text-white/50" : "text-slate-300"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Contenido: título + descripción (altura reservada para consistencia) */}
      <div className="relative mt-4 flex-1 flex flex-col">
        <h3
          className={`font-semibold text-[15px] tracking-tight leading-snug min-h-[2.5rem] ${
            primary ? "text-white" : "text-primary-dark"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-1 text-[12.5px] leading-relaxed line-clamp-2 min-h-[2.6rem] ${
            primary ? "text-white/85" : "text-slate-500"
          }`}
        >
          {text}
        </p>
      </div>

      {/* Pie: CTA alineado a la base en todas las cards */}
      <div
        className={`relative mt-3 pt-3 border-t flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] ${
          primary
            ? "border-white/25 text-white/90"
            : "border-slate-100 text-slate-400 group-hover:text-primary"
        } transition-colors duration-300`}
      >
        <span>Entrar</span>
        <FaArrowRight
          className={`text-xs transition-transform duration-300 group-hover:translate-x-1 ${
            primary ? "text-white" : "text-slate-300 group-hover:text-primary"
          }`}
        />
      </div>

      {/* Línea base decorativa que crece al hover */}
      <span
        className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ${
          primary ? "bg-white/60" : "bg-gradient-to-r from-accent to-accent-light"
        }`}
      />
    </Link>
  );
}

export default function LandingPage() {
  const { usuario } = useAuth();

  const accionesPorRol = () => {
    if (!usuario) {
      return [
        { to: "/buscar",    icon: <FaSearch />,    title: "Buscar mecánicos", text: "Explora talleres y profesionales cerca de ti.", primary: true },
        { to: "/login",     icon: <FaSignInAlt />, title: "Iniciar sesión",   text: "Accede a tu cuenta y gestiona tus citas." },
        { to: "/registro",  icon: <FaUserPlus />,  title: "Crear cuenta",     text: "Regístrate como cliente o mecánico." },
        { to: "/recuperar", icon: <FaCog />,       title: "Recuperar acceso", text: "Restablece tu contraseña fácilmente." },
      ];
    }
    if (usuario.rol === "cliente") {
      return [
        { to: "/buscar",      icon: <FaSearch />,       title: "Buscar mecánicos", text: "Encuentra al profesional ideal para tu vehículo.", primary: true },
        { to: "/mis-citas",   icon: <FaCalendarAlt />,  title: "Mis citas",        text: "Revisa el estado de tus reservas." },
        { to: "/emergencia",  icon: <FaCarCrash />,     title: "Emergencia",       text: "Solicita ayuda inmediata si tu auto se averió." },
        { to: "/perfil",      icon: <FaUserCircle />,   title: "Mi perfil",        text: "Actualiza tus datos personales." },
      ];
    }
    if (usuario.rol === "mecanico") {
      return [
        { to: "/mecanico/dashboard", icon: <FaTachometerAlt />,  title: "Dashboard",        text: "Resumen de tu actividad y desempeño.", primary: true },
        { to: "/mecanico/citas",     icon: <FaCalendarCheck />,  title: "Gestión de citas", text: "Acepta y atiende tus reservas." },
        { to: "/mecanico/servicios", icon: <FaTools />,          title: "Mis servicios",    text: "Administra los servicios que ofreces." },
        { to: "/mecanico/perfil",    icon: <FaCog />,            title: "Mi perfil",        text: "Actualiza tu información profesional." },
      ];
    }
    if (usuario.rol === "admin") {
      return [
        { to: "/admin",           icon: <FaTachometerAlt />, title: "Panel admin",  text: "Indicadores generales de la plataforma.", primary: true },
        { to: "/admin/usuarios",  icon: <FaUsers />,         title: "Usuarios",     text: "Gestiona cuentas de clientes y mecánicos." },
        { to: "/admin/mecanicos", icon: <FaUserShield />,    title: "Aprobaciones", text: "Revisa y aprueba registros de mecánicos." },
        { to: "/perfil",          icon: <FaUserCircle />,    title: "Mi perfil",    text: "Configura tu cuenta." },
      ];
    }
    if (usuario.rol === "soporte") {
      return [
        { to: "/soporte",          icon: <FaLifeRing />,    title: "Panel soporte", text: "Resumen de tickets y atención.", primary: true },
        { to: "/soporte/usuarios", icon: <FaUsers />,       title: "Usuarios",      text: "Atiende solicitudes de clientes." },
        { to: "/soporte/mecanicos",icon: <FaUserCog />,     title: "Talleres",      text: "Apoya a mecánicos registrados." },
        { to: "/soporte/resenas",  icon: <FaCommentDots />, title: "Reseñas",       text: "Modera reseñas reportadas." },
      ];
    }
    return [];
  };

  const acciones = accionesPorRol();
  const nombreCorto = usuario?.nombre?.split(" ")[0] || "";
  const etiquetaRol =
    usuario?.rol === "cliente"
      ? "Panel del cliente"
      : usuario?.rol === "mecanico"
      ? "Panel del mecánico"
      : usuario?.rol === "admin"
      ? "Panel administrativo"
      : usuario?.rol === "soporte"
      ? "Panel de soporte"
      : "Bienvenido";

  return (
    <section className="relative overflow-hidden text-white bg-mecanico bg-mecanico-hero -mt-[7rem] pt-[8rem] pb-10 min-h-screen flex items-center">
      {/* Capas de profundidad */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/70 via-primary-dark/40 to-zinc-950/70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent pointer-events-none" />

      {/* Halo de acento muy suave */}
      <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-accent/15 rounded-full blur-3xl pointer-events-none animate-blob" />
      <div
        className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] bg-primary/20 rounded-full blur-3xl pointer-events-none animate-blob"
        style={{ animationDelay: "4s" }}
      />

      {/* Engranaje decorativo (uno solo, lento) */}
      <img
        src="/fondo_1.png"
        alt=""
        aria-hidden="true"
        className="hidden lg:block absolute top-[14%] right-[3%] w-40 opacity-15 animate-spin-slow pointer-events-none"
      />

      <div className="relative w-full max-w-[80rem] mx-auto px-6 grid lg:grid-cols-[1.05fr_1.2fr] gap-10 lg:gap-14 items-center">
        {/* Lado izquierdo: identidad */}
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 shadow-sm">
            <FaBolt className="text-accent animate-pulse" /> {etiquetaRol}
          </span>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.05] drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            {usuario ? (
              <>
                Hola,{" "}
                <span className="text-gradient-accent">{nombreCorto}</span>
              </>
            ) : (
              <>
                Juan <span className="text-gradient-accent">El Mecánico</span>
              </>
            )}
          </h1>

          <div className="mt-4 flex items-center gap-2">
            <span className="h-[3px] w-16 rounded-full bg-gradient-to-r from-accent to-accent-light" />
            <span className="h-[3px] w-6 rounded-full bg-accent/60" />
            <span className="h-[3px] w-2 rounded-full bg-accent/30" />
          </div>

          <p className="mt-5 text-base sm:text-lg text-white/85 max-w-md leading-relaxed">
            {usuario
              ? "Todo el sistema a un clic. Elige a dónde quieres ir desde tu panel."
              : "Plataforma de reservas online con mecánicos profesionales verificados."}
          </p>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-white/75">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <FaUserShield className="text-accent" /> Verificados
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <FaStar className="text-accent" /> Reseñas reales
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <FaBolt className="text-accent" /> Reserva en minutos
            </span>
          </div>

          {/* Logo flotante discreto */}
          <img
            src="/logo_nuevo.png"
            alt="Juan El Mecánico"
            className="hidden lg:block mt-8 w-32 opacity-90 animate-float-slow drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
          />
        </div>

        {/* Lado derecho: panel de accesos */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                Accesos rápidos
              </h2>
              <p className="text-[11px] text-white/40 mt-1">
                {acciones.length} secciones disponibles
              </p>
            </div>
            {usuario && (
              <Link
                to="/perfil"
                className="text-xs text-white/60 hover:text-accent inline-flex items-center gap-1.5 transition-colors group"
              >
                <FaUserCircle className="text-base group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">{usuario.nombre}</span>
              </Link>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 stagger">
            {acciones.map((a, i) => (
              <AccionCard key={a.to} index={i} {...a} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
