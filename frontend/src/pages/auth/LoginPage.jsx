import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaShieldAlt,
  FaStar,
  FaBolt,
  FaSignInAlt,
  FaWrench,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Bienvenido, ${u.nombre}`);
      const dest =
        u.rol === "admin"
          ? "/admin"
          : u.rol === "mecanico"
          ? "/mecanico/dashboard"
          : "/buscar";
      navigate(dest);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="bg-page-dark min-h-screen -mt-[7rem] pt-[8rem] pb-10 px-4 flex items-start justify-center relative overflow-hidden"
      style={{ "--bg-image": "url('/fondo_2.jpg')" }}
    >
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-zinc-700/30 rounded-full blur-3xl animate-blob pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "4s" }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none animate-blob" style={{ animationDelay: "6s" }} />

      <div className="glass-panel w-[min(64rem,calc(100vw-2rem))] p-0 overflow-hidden grid md:grid-cols-[1fr_1.05fr] animate-scale-in relative">
        {/* PANEL DERECHO — branding de taller (visualmente queda a la derecha) */}
        <aside className="order-2 hidden md:flex flex-col justify-between p-8 lg:p-10 relative overflow-hidden bg-gradient-to-br from-zinc-950/85 via-zinc-900/55 to-zinc-950/85 border-l border-white/10">
          <img
            src="/fondo_1.png"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-16 -right-16 w-80 opacity-[0.08] animate-spin-slow pointer-events-none"
          />
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(-45deg,#fbbf24_0_12px,#18181b_12px_24px)] opacity-60" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur text-[10px] font-bold tracking-[0.25em] text-white/90 uppercase">
              <FaWrench className="text-accent-light" /> Taller a tu servicio
            </span>

            <img
              src="/logo_nuevo.png"
              alt="Juan El Mecánico"
              className="mt-5 w-52 lg:w-64 h-auto object-contain animate-float-slow drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
            />

            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow">
              Bienvenido al <span className="text-gradient-accent">taller</span>
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-sm">
              Entra a tu cuenta y gestiona tus citas, mecánicos favoritos y
              reseñas — todo en un solo lugar.
            </p>
          </div>

          <ul className="relative mt-6 space-y-3">
            {[
              { icon: <FaShieldAlt />, t: "Mecánicos verificados", d: "Aprobados por nuestro equipo" },
              { icon: <FaStar />,       t: "Reseñas reales",         d: "De clientes verificados" },
              { icon: <FaBolt />,       t: "Reserva en minutos",     d: "Sin llamadas ni esperas" },
            ].map((f) => (
              <li key={f.t} className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 text-accent-light border border-accent/40 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm">{f.t}</div>
                  <div className="text-xs text-white/60">{f.d}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="absolute bottom-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(-45deg,#fbbf24_0_12px,#18181b_12px_24px)] opacity-60" />
        </aside>

        {/* FORMULARIO — visualmente queda a la izquierda */}
        <div className="order-1 relative p-7 sm:p-9 lg:p-10">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

          <img
            src="/logo_nuevo.png"
            alt="Juan El Mecánico"
            className="md:hidden mx-auto mb-3 h-32 w-32 object-contain animate-float-slow drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)]"
          />

          <div className="relative text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-dark text-zinc-950 mb-3 shadow-glow-accent">
              <FaSignInAlt className="text-xl" />
            </div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow">
              Iniciar sesión
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div>
              <label className="label-dark">Correo electrónico</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={update}
                className="input-dark"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label className="label-dark">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={update}
                className="input-dark"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="btn-accent w-full text-base py-3 shine-on-hover"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-3 text-sm text-center relative">
            <Link
              to="/recuperar"
              className="text-white/60 hover:text-accent-light hover:underline underline-offset-4"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/40 relative">
            <span className="flex-1 h-px bg-white/15" />
            o
            <span className="flex-1 h-px bg-white/15" />
          </div>

          <p className="text-sm text-center text-white/70 relative">
            ¿No tienes cuenta?{" "}
            <Link
              to="/registro"
              className="text-accent-light font-semibold hover:text-accent underline-offset-4 hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
