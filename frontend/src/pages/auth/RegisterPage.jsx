import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaEnvelope,
  FaArrowLeft,
  FaRedo,
  FaUserPlus,
  FaShieldAlt,
  FaStar,
  FaBolt,
  FaWrench,
  FaIdCard,
  FaStore,
  FaMapMarkerAlt,
  FaTools,
  FaTruck,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";
import { enviarCodigoRequest } from "../../api/auth.api";
import CodigoInput from "../../components/CodigoInput.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const success = useSuccess();

  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    dni: "",
    password: "",
    rol: "cliente",
    // Datos del taller (solo si rol === "mecanico")
    nombreLocal: "",
    especialidades: "",
    descripcion: "",
    experiencia: "",
    ubicacion: "",
    esMovil: false,
  });
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function update(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function enviarCodigo(reenvio = false) {
    if (!form.email) return toast.error("Ingresa tu correo");
    if (!form.nombre) return toast.error("Ingresa tu nombre");
    if (!form.dni || form.dni.trim().length < 6)
      return toast.error("Ingresa un DNI válido (mín. 6 dígitos)");
    if (form.password.length < 6)
      return toast.error("La contraseña debe tener al menos 6 caracteres");
    if (form.rol === "mecanico") {
      if (!form.nombreLocal.trim())
        return toast.error("Ingresa el nombre de tu local/taller");
      if (!form.especialidades.trim())
        return toast.error("Ingresa al menos una especialidad");
      if (!form.ubicacion.trim())
        return toast.error("Ingresa la ubicación de tu taller");
    }

    setEnviando(true);
    try {
      const r = await enviarCodigoRequest(form.email, "registro");
      toast.success(r.mensaje || "Código enviado");
      setPaso(2);
      setCooldown(45);
      if (reenvio) setCodigo("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "No se pudo enviar el código");
    } finally {
      setEnviando(false);
    }
  }

  async function registrarse(e) {
    e?.preventDefault();
    if (codigo.length !== 6)
      return toast.error("Ingresa los 6 dígitos del código");
    setRegistrando(true);
    try {
      const payload = {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        telefono: form.telefono,
        dni: form.dni,
        rol: form.rol,
        codigo,
      };
      if (form.rol === "mecanico") {
        payload.mecanico = {
          nombreLocal: form.nombreLocal,
          especialidades: form.especialidades,
          descripcion: form.descripcion || null,
          experiencia: form.experiencia || null,
          ubicacion: form.ubicacion,
          esMovil: !!form.esMovil,
        };
      }
      const u = await register(payload);
      await success({
        title:
          u.rol === "mecanico"
            ? "¡Solicitud enviada al administrador!"
            : "¡Cuenta creada con éxito!",
        message:
          u.rol === "mecanico"
            ? `Bienvenido ${u.nombre}. Tu cuenta fue creada y la información de tu taller fue enviada al administrador para su aprobación. Te avisaremos por correo cuando esté aprobada.`
            : `Bienvenido ${u.nombre}. Ya puedes buscar talleres y reservar tu primera cita.`,
        actionLabel: "Continuar",
      });
      navigate(u.rol === "mecanico" ? "/mecanico/perfil" : "/buscar");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Error al registrarse",
      );
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <div
      className="bg-page-dark min-h-screen -mt-[7rem] pt-[8rem] pb-10 px-4 flex items-start justify-center relative overflow-hidden"
      style={{ "--bg-image": "url('/fondo_3.jpg')" }}
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
              <FaWrench className="text-accent-light" /> Únete al taller
            </span>

            <img
              src="/logo_nuevo.png"
              alt="Juan El Mecánico"
              className="mt-5 w-52 lg:w-64 h-auto object-contain animate-float-slow drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
            />

            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow">
              Crea tu <span className="text-gradient-accent">cuenta</span>
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-sm">
              Reserva citas, califica a mecánicos y mantén tu vehículo siempre
              a punto. ¡Es gratis!
            </p>
          </div>

          <ul className="relative mt-6 space-y-3">
            {[
              { icon: <FaShieldAlt />, t: "Cuenta verificada por correo", d: "Tu seguridad primero" },
              { icon: <FaStar />,       t: "Califica el servicio",          d: "Ayuda a otros conductores" },
              { icon: <FaBolt />,       t: "Reserva instantánea",           d: "Sin llamadas, sin esperas" },
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

          <img
            src="/logo_nuevo.png"
            alt="Juan El Mecánico"
            className="md:hidden mx-auto mb-3 h-32 w-32 object-contain animate-float-slow drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)]"
          />

          <div className="relative text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-dark text-zinc-950 mb-3 shadow-glow-accent">
              <FaUserPlus className="text-xl" />
            </div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow">
              {paso === 1 ? "Crear cuenta" : "Verifica tu correo"}
            </h1>
            <p className="text-sm text-white/70 mt-1">
              {paso === 1
                ? "Completa tus datos para empezar"
                : "Te enviamos un código a tu correo"}
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
              className="space-y-3.5 relative"
            >
              <div>
                <label className="label-dark">Tipo de cuenta</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "cliente", t: "Cliente" },
                    { v: "mecanico", t: "Mecánico" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.v}
                      onClick={() => setForm({ ...form, rol: opt.v })}
                      className={`px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                        form.rol === opt.v
                          ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                          : "border-white/15 text-white/85 bg-white/5 hover:border-accent/50 hover:bg-white/10 backdrop-blur"
                      }`}
                    >
                      {opt.t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-dark">Nombre completo</label>
                <input
                  name="nombre"
                  required
                  value={form.nombre}
                  onChange={update}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="label-dark inline-flex items-center gap-2">
                  <FaIdCard className="text-accent-light" /> DNI / Documento
                </label>
                <input
                  name="dni"
                  required
                  inputMode="numeric"
                  value={form.dni}
                  onChange={update}
                  className="input-dark"
                  placeholder="12345678"
                />
                <p className="text-xs text-white/55 mt-1">
                  Lo usaremos para verificar tu identidad.
                </p>
              </div>
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
                <p className="text-xs text-white/55 mt-1">
                  Te enviaremos un código de verificación.
                </p>
              </div>
              <div>
                <label className="label-dark">Teléfono (opcional)</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={update}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="label-dark">Contraseña</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={update}
                  className="input-dark"
                />
              </div>

              {/* Bloque de datos del taller (solo si es mecánico) */}
              {form.rol === "mecanico" && (
                <div className="mt-2 pt-4 border-t border-white/10 space-y-3.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-[10px] font-bold tracking-[0.2em] text-accent-light uppercase">
                    <FaWrench /> Datos de tu taller
                  </div>
                  <p className="text-xs text-white/65 -mt-1">
                    Esta información la revisará el administrador antes de
                    aprobar tu cuenta.
                  </p>

                  <div>
                    <label className="label-dark inline-flex items-center gap-2">
                      <FaStore className="text-accent-light" /> Nombre del local
                    </label>
                    <input
                      name="nombreLocal"
                      required
                      value={form.nombreLocal}
                      onChange={update}
                      className="input-dark"
                      placeholder="Taller Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="label-dark inline-flex items-center gap-2">
                      <FaTools className="text-accent-light" /> Especialidades
                    </label>
                    <input
                      name="especialidades"
                      required
                      value={form.especialidades}
                      onChange={update}
                      className="input-dark"
                      placeholder="Motor, frenos, eléctrico..."
                    />
                  </div>
                  <div>
                    <label className="label-dark inline-flex items-center gap-2">
                      <FaMapMarkerAlt className="text-accent-light" /> Ubicación del taller
                    </label>
                    <input
                      name="ubicacion"
                      required
                      value={form.ubicacion}
                      onChange={update}
                      className="input-dark"
                      placeholder="Av. Principal 123, Distrito"
                    />
                  </div>
                  <div>
                    <label className="label-dark">Descripción (opcional)</label>
                    <textarea
                      name="descripcion"
                      rows={3}
                      value={form.descripcion}
                      onChange={update}
                      className="input-dark"
                      placeholder="Cuéntanos sobre tu taller, qué te diferencia..."
                    />
                  </div>
                  <div>
                    <label className="label-dark">Experiencia (opcional)</label>
                    <input
                      name="experiencia"
                      value={form.experiencia}
                      onChange={update}
                      className="input-dark"
                      placeholder="Ej: 10 años trabajando con vehículos europeos"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      name="esMovil"
                      checked={form.esMovil}
                      onChange={update}
                      className="w-4 h-4 accent-accent"
                    />
                    <FaTruck className="text-accent-light" />
                    <span className="text-sm text-white/85 font-semibold">
                      Ofrezco servicio a domicilio
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="btn-accent w-full shine-on-hover"
                disabled={enviando}
              >
                <FaEnvelope />{" "}
                {enviando ? "Enviando código..." : "Enviar código al correo"}
              </button>

              {form.rol === "mecanico" && (
                <p className="text-xs text-accent-light text-center">
                  Tu cuenta se creará con estado <strong>pendiente</strong> hasta
                  que el administrador apruebe tu taller.
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={registrarse} className="space-y-4 relative">
              <div className="text-center">
                <p className="text-sm text-white/70">
                  Revisa tu bandeja de entrada (y spam) en
                </p>
                <p className="font-semibold text-accent-light break-all">
                  {form.email}
                </p>
              </div>

              <div>
                <label className="label-dark text-center !mb-2">
                  Ingresa el código de 6 dígitos
                </label>
                <CodigoInput value={codigo} onChange={setCodigo} />
              </div>

              <button
                type="submit"
                className="btn-accent w-full shine-on-hover"
                disabled={registrando || codigo.length !== 6}
              >
                {registrando ? "Creando cuenta..." : "Verificar y crear cuenta"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="text-white/65 hover:text-accent-light inline-flex items-center gap-1"
                >
                  <FaArrowLeft /> Volver
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
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="text-accent-light font-semibold hover:text-accent underline-offset-4 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
