import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaPhone,
  FaLock,
  FaSignOutAlt,
  FaShieldAlt,
  FaCalendarAlt,
  FaUserCircle,
  FaSave,
  FaPlusCircle,
} from "react-icons/fa";
import { actualizarPerfilRequest } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import useTilt from "../../hooks/useTilt";
import AvatarUploader from "../../components/AvatarUploader.jsx";
import AgendarCitaWizard from "../../components/AgendarCitaWizard.jsx";

export default function PerfilPage() {
  const { usuario, setUsuario, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [form, setForm] = useState({
    nombre: usuario?.nombre || "",
    telefono: usuario?.telefono || "",
    dni: usuario?.dni || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const tiltHero = useTilt({ max: 5 });
  const esCliente = usuario?.rol === "cliente";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre,
        telefono: form.telefono,
        dni: form.dni,
      };
      if (form.password) payload.password = form.password;
      const actualizado = await actualizarPerfilRequest(payload);
      setUsuario({ ...usuario, ...actualizado });
      setForm({ ...form, password: "" });
      toast.success("Perfil actualizado");
    } catch (e) {
      toast.error(
        e.response?.data?.detail ||
          e.response?.data?.message ||
          "Error al actualizar",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const ok = await confirm({
      title: "¿Cerrar sesión?",
      message: "Tendrás que volver a iniciar sesión para entrar.",
      confirmText: "Sí, salir",
      cancelText: "Cancelar",
      tipo: "logout",
    });
    if (!ok) return;
    logout();
    navigate("/login");
  }

  const fechaRegistro = usuario?.fechaRegistro
    ? new Date(usuario.fechaRegistro).toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  function handleAvatarChange(actualizado) {
    setUsuario({ ...usuario, ...actualizado });
  }

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        {/* HERO del perfil */}
        <section
          ref={tiltHero.ref}
          {...tiltHero.handlers}
          className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-6 sm:p-8"
        >
          {/* SVG decorativo */}
          <svg
            aria-hidden
            className="absolute inset-0 w-full h-full opacity-[0.10] pointer-events-none"
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="pfline" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#5be1ff" />
                <stop offset="1" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <path d="M0,150 C200,80 400,180 600,90 L800,140 L800,200 L0,200 Z" fill="url(#pfline)" />
          </svg>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
            {/* Avatar grande clickeable */}
            <div className="shrink-0 sm:self-center">
              <AvatarUploader
                fotoUrl={usuario?.fotoPerfil}
                nombre={usuario?.nombre}
                onChange={handleAvatarChange}
                size={112}
              />
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <span className="chip-premium">
                <FaUserCircle className="text-accent-light" /> Mi perfil
              </span>
              <h1 className="cliente-headline text-white drop-shadow mt-3">
                {usuario?.nombre || "Usuario"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur uppercase tracking-wider font-bold text-white/85">
                  <FaShieldAlt className="text-accent-light" /> {usuario?.rol}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-white/65">
                  <FaCalendarAlt /> Miembro desde {fechaRegistro}
                </span>
              </div>

              {/* CTA AGENDAR CITA (solo cliente) */}
              {esCliente && (
                <button
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className="relative group mt-4 inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl font-extrabold text-zinc-950 bg-gradient-to-br from-accent to-accent-dark shadow-[0_14px_40px_-12px_rgba(245,158,11,0.7)] hover:shadow-[0_18px_50px_-12px_rgba(245,158,11,0.9)] hover:-translate-y-0.5 transition-all shine-on-hover overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <FaPlusCircle className="text-xl animate-pulse" />
                  <span>Agendar nueva cita</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Datos básicos read-only en cards mini */}
        <section className="grid sm:grid-cols-2 gap-4">
          <MiniCard icon={<FaEnvelope />} label="Correo electrónico" value={usuario?.email} />
          <MiniCard
            icon={<FaIdCard />}
            label="DNI / Documento"
            value={usuario?.dni}
            placeholder="No registrado"
          />
        </section>

        {/* Formulario de edición */}
        <form
          onSubmit={handleSubmit}
          className="glass-v2 relative overflow-hidden p-6 sm:p-7 space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark text-zinc-950 flex items-center justify-center shadow-glow-accent">
              <FaUser />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Editar información
              </h2>
              <p className="text-xs text-white/60">
                Actualiza tus datos. Tu correo no se puede cambiar.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-dark inline-flex items-center gap-2">
                <FaUser className="text-accent-light" /> Nombre completo
              </label>
              <input
                className="input-dark"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label-dark inline-flex items-center gap-2">
                <FaPhone className="text-accent-light" /> Teléfono
              </label>
              <input
                className="input-dark"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej: 999 999 999"
              />
            </div>
            <div>
              <label className="label-dark inline-flex items-center gap-2">
                <FaIdCard className="text-accent-light" /> DNI / Documento
              </label>
              <input
                className="input-dark"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                placeholder="12345678"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="label-dark inline-flex items-center gap-2">
                <FaLock className="text-accent-light" /> Nueva contraseña
              </label>
              <input
                type="password"
                className="input-dark"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Dejar en blanco para no cambiar"
              />
            </div>
          </div>

          <button
            className="btn-accent w-full sm:w-auto sm:ml-auto sm:flex shine-on-hover text-base py-3 px-8"
            disabled={loading}
          >
            <FaSave /> {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        {/* Acciones de cuenta */}
        <section className="glass-v2 p-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-white">Cerrar sesión</h3>
            <p className="text-xs text-white/60 mt-0.5">
              Salir de tu cuenta en este dispositivo.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border border-red-400/50 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.6)] transition-all inline-flex items-center gap-2"
          >
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </section>
      </div>

      {showWizard && <AgendarCitaWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}

function MiniCard({ icon, label, value, placeholder = "—" }) {
  const tilt = useTilt({ max: 4 });
  return (
    <div
      ref={tilt.ref}
      {...tilt.handlers}
      className="glass-v2-soft tilt-3d relative overflow-hidden p-4 flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 text-accent-light border border-accent/40 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          {label}
        </div>
        <div className="text-white font-semibold truncate">
          {value || <span className="text-white/40 italic">{placeholder}</span>}
        </div>
      </div>
    </div>
  );
}
