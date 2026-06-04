import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaCalendarAlt,
  FaSearch,
  FaTachometerAlt,
  FaCog,
  FaCarCrash,
  FaCommentDots,
  FaLifeRing,
} from "react-icons/fa";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    const ok = await confirm({
      title: "¿Cerrar sesión?",
      message:
        "Estás a punto de salir de tu cuenta. Tendrás que volver a iniciar sesión para entrar.",
      confirmText: "Sí, cerrar sesión",
      cancelText: "Quedarme",
      tipo: "logout",
    });
    if (!ok) return;
    logout();
    navigate("/login");
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 text-white z-30 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-zinc-950/90 backdrop-blur-xl shadow-lg border-b border-white/10"
          : "bg-zinc-950/10 backdrop-blur-md border-b border-transparent shadow-none"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo_nuevo.png"
            alt="Juan El Mecánico"
            className="h-24 w-24 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]"
          />
          <div className="leading-tight hidden md:block">
            <div className="font-extrabold text-lg tracking-tight">
              Juan <span className="text-accent">El Mecánico</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              Reservas online
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          {!usuario && (
            <>
              <Link to="/buscar" className="nav-btn-elec">
                <FaSearch /> <span className="hidden sm:inline">Mecánicos</span>
              </Link>
              <Link to="/login" className="nav-btn-elec hidden sm:inline-flex">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="nav-btn-elec nav-btn-elec-accent">
                Registrarse
              </Link>
            </>
          )}

          {usuario?.rol === "cliente" && (
            <>
              <Link
                to="/emergencia"
                className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-white bg-gradient-to-r from-danger to-red-600 hover:from-red-500 hover:to-danger shadow-lg hover:shadow-glow-accent transition-all animate-pulse-glow"
                title="¿Tu auto se averió?"
              >
                <FaCarCrash />
                <span className="hidden sm:inline">Emergencia</span>
              </Link>
              <Link to="/buscar" className="nav-link">
                <FaSearch /> <span className="hidden sm:inline">Buscar</span>
              </Link>
              <Link to="/mis-citas" className="nav-link">
                <FaCalendarAlt />{" "}
                <span className="hidden sm:inline">Mis citas</span>
              </Link>
            </>
          )}

          {usuario?.rol === "mecanico" && (
            <>
              <Link to="/mecanico/dashboard" className="nav-link">
                <FaTachometerAlt />{" "}
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link to="/mecanico/servicios" className="nav-link hidden sm:flex">
                Servicios
              </Link>
              <Link to="/mecanico/citas" className="nav-link hidden sm:flex">
                Citas
              </Link>
              <Link to="/mecanico/perfil" className="nav-link">
                <FaCog /> <span className="hidden sm:inline">Perfil</span>
              </Link>
            </>
          )}

          {usuario?.rol === "admin" && (
            <>
              <Link to="/admin" className="nav-link">
                <FaTachometerAlt />{" "}
                <span className="hidden sm:inline">Admin</span>
              </Link>
              <Link to="/admin/usuarios" className="nav-link hidden sm:flex">
                Usuarios
              </Link>
              <Link to="/admin/mecanicos" className="nav-link hidden sm:flex">
                Mecánicos
              </Link>
            </>
          )}

          {usuario?.rol === "soporte" && (
            <>
              <Link to="/soporte" className="nav-link">
                <FaLifeRing />{" "}
                <span className="hidden sm:inline">Soporte</span>
              </Link>
              <Link to="/soporte/usuarios" className="nav-link hidden sm:flex">
                Usuarios
              </Link>
              <Link to="/soporte/mecanicos" className="nav-link hidden sm:flex">
                Talleres
              </Link>
              <Link to="/soporte/resenas" className="nav-link hidden sm:flex">
                <FaCommentDots /> Reseñas
              </Link>
            </>
          )}

          {usuario && (
            <>
              <Link
                to="/perfil"
                className="nav-link ml-1 pl-3 border-l border-white/15"
                title={usuario.nombre}
              >
                {usuario.fotoPerfil ? (
                  <img
                    src={usuario.fotoPerfil}
                    alt={usuario.nombre}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30 shadow-md"
                  />
                ) : (
                  <FaUserCircle className="text-lg" />
                )}
                <span className="hidden md:inline">{usuario.nombre}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="nav-link"
                title="Cerrar sesión"
              >
                <FaSignOutAlt />
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
