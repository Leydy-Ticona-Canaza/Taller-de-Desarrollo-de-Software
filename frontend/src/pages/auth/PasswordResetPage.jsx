import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaEnvelope,
  FaArrowLeft,
  FaRedo,
  FaKey,
  FaShieldAlt,
  FaLock,
  FaCheckCircle,
  FaWrench,
} from "react-icons/fa";
import { enviarCodigoRequest, resetPasswordRequest } from "../../api/auth.api";
import CodigoInput from "../../components/CodigoInput.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const success = useSuccess();
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function enviarCodigo(reenvio = false) {
    if (!email) return toast.error("Ingresa tu correo");
    setEnviando(true);
    try {
      const r = await enviarCodigoRequest(email, "reset");
      toast.success(r.mensaje || "Si el correo está registrado, recibirás un código");
      setPaso(2);
      setCooldown(45);
      if (reenvio) setCodigo("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "No se pudo enviar el código");
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarContrasena(e) {
    e?.preventDefault();
    if (codigo.length !== 6) return toast.error("Ingresa los 6 dígitos");
    if (password.length < 6)
      return toast.error("La contraseña debe tener al menos 6 caracteres");
    if (password !== password2)
      return toast.error("Las contraseñas no coinciden");

    setGuardando(true);
    try {
      await resetPasswordRequest({ email, codigo, password });
      await success({
        title: "Contraseña actualizada",
        message: "Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.",
        emoji: "🔐",
        actionLabel: "Ir a inicio de sesión",
      });
      navigate("/login");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al cambiar la contraseña");
    } finally {
      setGuardando(false);
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
        {/* PANEL DERECHO — branding */}
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
              <FaWrench className="text-accent-light" /> Caja de herramientas
            </span>

            <img
              src="/logo_nuevo.png"
              alt="Juan El Mecánico"
              className="mt-5 w-52 lg:w-64 h-auto object-contain animate-float-slow drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
            />

            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow">
              Recupera tu <span className="text-gradient-accent">acceso</span>
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-sm">
              Te enviaremos un código de 6 dígitos por correo para verificar tu
              identidad y poder restablecer tu contraseña.
            </p>
          </div>

          <ul className="relative mt-6 space-y-3">
            {[
              { icon: <FaShieldAlt />,    t: "Verificación por correo",       d: "Solo tú puedes recibir el código" },
              { icon: <FaLock />,         t: "Restablecimiento seguro",       d: "Tu nueva contraseña queda cifrada" },
              { icon: <FaCheckCircle />,  t: "Acceso inmediato",              d: "Inicia sesión al terminar" },
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

        {/* FORMULARIO — visualmente a la izquierda */}
        <div className="order-1 relative p-7 sm:p-9 lg:p-10">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-dark text-zinc-950 mb-3 shadow-glow-accent">
              <FaKey className="text-xl" />
            </div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow">
              Recuperar contraseña
            </h1>
            <p className="text-sm text-white/70 mt-1">
              {paso === 1
                ? "Te enviaremos un código por correo"
                : "Ingresa el código y tu nueva contraseña"}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-5 relative">
            <div className={`flex-1 h-1.5 rounded-full ${paso >= 1 ? "bg-gradient-to-r from-accent to-accent-light" : "bg-white/15"}`} />
            <div className={`flex-1 h-1.5 rounded-full ${paso >= 2 ? "bg-gradient-to-r from-accent to-accent-light" : "bg-white/15"}`} />
          </div>

          {paso === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviarCodigo(false);
              }}
              className="space-y-4 relative"
            >
              <div>
                <label className="label-dark">Correo registrado</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  placeholder="tu@correo.com"
                />
              </div>
              <button
                type="submit"
                className="btn-accent w-full shine-on-hover"
                disabled={enviando}
              >
                <FaEnvelope />{" "}
                {enviando ? "Enviando..." : "Enviar código"}
              </button>
            </form>
          ) : (
            <form onSubmit={cambiarContrasena} className="space-y-4 relative">
              <div className="text-center text-sm">
                <p className="text-white/70">Código enviado a</p>
                <p className="font-semibold text-accent-light break-all">
                  {email}
                </p>
              </div>

              <div>
                <label className="label-dark text-center !mb-2">
                  Código de 6 dígitos
                </label>
                <CodigoInput value={codigo} onChange={setCodigo} />
              </div>

              <div>
                <label className="label-dark">Nueva contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="label-dark">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="input-dark"
                />
              </div>

              <button
                type="submit"
                className="btn-accent w-full shine-on-hover"
                disabled={guardando || codigo.length !== 6}
              >
                {guardando ? "Guardando..." : "Cambiar contraseña"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="text-white/65 hover:text-accent-light inline-flex items-center gap-1"
                >
                  <FaArrowLeft /> Cambiar correo
                </button>
                <button
                  type="button"
                  onClick={() => enviarCodigo(true)}
                  disabled={enviando || cooldown > 0}
                  className="text-accent-light font-semibold hover:underline inline-flex items-center gap-1 disabled:text-white/30 disabled:no-underline"
                >
                  <FaRedo />
                  {cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar código"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-5 text-sm text-center text-white/70 relative">
            ¿Recordaste tu contraseña?{" "}
            <Link
              to="/login"
              className="text-accent-light font-semibold hover:text-accent underline-offset-4 hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
