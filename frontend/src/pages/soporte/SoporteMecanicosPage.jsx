import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaTimes,
  FaTools,
  FaStore,
  FaIdCard,
  FaPhone,
  FaEnvelope,
  FaTruck,
  FaCalendarAlt,
  FaUserClock,
  FaMapMarkerAlt,
  FaBan,
  FaPlay,
  FaKey,
  FaLifeRing,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  soporteListarMecanicos,
  soporteCambiarEstadoUsuario,
  soporteResetPassword,
} from "../../api/soporte.api";
import StarRating from "../../components/StarRating.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";

export default function SoporteMecanicosPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const success = useSuccess();
  const [q, setQ] = useState("");
  const [resetModal, setResetModal] = useState(null);

  const { data: mecanicos = [], isLoading } = useQuery({
    queryKey: ["soporte-mecanicos"],
    queryFn: soporteListarMecanicos,
  });

  const cambiarEstadoMut = useMutation({
    mutationFn: ({ id, activo }) => soporteCambiarEstadoUsuario(id, activo),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["soporte-mecanicos"] });
      qc.invalidateQueries({ queryKey: ["soporte-usuarios"] });
      success({
        title: vars.activo ? "Cuenta reactivada" : "Cuenta suspendida",
        message: vars.activo
          ? "El mecánico ya puede iniciar sesión y aparecer nuevamente."
          : "El mecánico ya no podrá iniciar sesión hasta que reactives su cuenta.",
        emoji: vars.activo ? "✅" : "🚫",
      });
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error"),
  });

  async function toggleEstado(m, activo) {
    const ok = await confirm({
      title: activo ? "¿Reactivar esta cuenta?" : "¿Suspender esta cuenta?",
      message: `${m.usuario?.nombre}\n${m.usuario?.email}\n\n${
        activo
          ? "El mecánico podrá iniciar sesión y volver a operar normalmente."
          : "Al suspender la cuenta el mecánico no podrá iniciar sesión ni aparecer en búsquedas. Esta acción se puede revertir."
      }`,
      confirmText: activo ? "Sí, reactivar" : "Sí, suspender",
      cancelText: "Cancelar",
      tipo: activo ? "wrench" : "danger",
      colorBoton: activo ? "success" : undefined,
    });
    if (ok) cambiarEstadoMut.mutate({ id: m.usuario.id, activo });
  }

  if (isLoading) return <LoadingSpinner />;

  // Filtrado
  const term = q.trim().toLowerCase();
  const matches = (m) => {
    if (!term) return true;
    const fields = [
      m.usuario?.nombre,
      m.usuario?.email,
      m.usuario?.dni,
      m.usuario?.telefono,
      m.nombreLocal,
      m.especialidades,
      m.ubicacion,
    ];
    return fields.some((v) => v && String(v).toLowerCase().includes(term));
  };

  const filtrados = mecanicos.filter(matches);

  function renderTarjeta(m) {
    const fotos = (m.fotosReferencia || "").split(",").filter(Boolean);
    const cuentaActiva = m.usuario?.activo;
    const fechaRegistro = m.usuario?.fechaRegistro
      ? new Date(m.usuario.fechaRegistro).toLocaleDateString("es-PE", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : null;

    return (
      <div key={m.id} className="glass-v2 p-0 overflow-hidden">
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b ${
            !cuentaActiva
              ? "bg-gradient-to-r from-red-500/15 to-red-500/5 border-red-400/30"
              : m.aprobado
                ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border-emerald-400/25"
                : "bg-gradient-to-r from-amber-400/15 to-amber-400/5 border-amber-400/30"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 font-extrabold text-lg flex items-center justify-center shadow-lg shrink-0">
              {m.usuario?.fotoPerfil ? (
                <img
                  src={m.usuario.fotoPerfil}
                  alt={m.usuario?.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                m.usuario?.nombre?.charAt(0) || "M"
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-white truncate">
                {m.usuario?.nombre}
              </h3>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {!cuentaActiva && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/25 text-red-300 border border-red-400/40">
                    Cuenta suspendida
                  </span>
                )}
                {cuentaActiva && m.aprobado && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                    <FaCheckCircle className="mr-1" /> Aprobado
                  </span>
                )}
                {cuentaActiva && !m.aprobado && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-amber-400/25 text-amber-200 border border-amber-400/40">
                    Pendiente del admin
                  </span>
                )}
                {m.esMovil && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-accent/20 text-accent-light border border-accent/40">
                    <FaTruck /> A domicilio
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setResetModal(m)}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-accent-light bg-accent/15 border border-accent/40 hover:bg-accent/25 transition-all inline-flex items-center gap-1.5"
              title="Restablecer contraseña"
            >
              <FaKey /> Reset clave
            </button>
            {cuentaActiva ? (
              <button
                onClick={() => toggleEstado(m, false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400/50 shadow-[0_8px_24px_-10px_rgba(217,119,6,0.6)] transition-all inline-flex items-center gap-1.5"
                title="Suspender cuenta (el mecánico no podrá iniciar sesión)"
              >
                <FaBan /> Suspender
              </button>
            ) : (
              <button
                onClick={() => toggleEstado(m, true)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 shadow-[0_8px_24px_-10px_rgba(16,185,129,0.6)] transition-all inline-flex items-center gap-1.5"
                title="Reactivar cuenta"
              >
                <FaPlay /> Reactivar
              </button>
            )}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-5 grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-1">
              Identidad y contacto
            </div>

            <Campo icon={<FaIdCard />} label="DNI">
              {m.usuario?.dni || (
                <span className="text-amber-300 italic">No registrado</span>
              )}
            </Campo>

            <Campo icon={<FaEnvelope />} label="Correo">
              <a
                href={`mailto:${m.usuario?.email}`}
                className="text-accent-light hover:underline break-all"
              >
                {m.usuario?.email}
              </a>
            </Campo>

            {m.usuario?.telefono && (
              <Campo icon={<FaPhone />} label="Teléfono">
                <a
                  href={`tel:${m.usuario.telefono}`}
                  className="text-accent-light hover:underline"
                >
                  {m.usuario.telefono}
                </a>
              </Campo>
            )}

            {fechaRegistro && (
              <Campo icon={<FaCalendarAlt />} label="Se registró">
                {fechaRegistro}
              </Campo>
            )}

            <div className="pt-1.5">
              <StarRating value={m.calificacionPromedio || 0} />
              <span className="ml-2 text-xs text-white/55">
                {m.totalTrabajos || 0} trabajos
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-1">
              Información del taller
            </div>

            <Campo icon={<FaStore />} label="Nombre del local">
              {m.nombreLocal || (
                <span className="text-white/40 italic">Sin especificar</span>
              )}
            </Campo>

            <Campo icon={<FaTools />} label="Especialidades">
              {m.especialidades || (
                <span className="text-white/40 italic">Sin especificar</span>
              )}
            </Campo>

            <Campo icon={<FaMapMarkerAlt />} label="Ubicación">
              {m.ubicacion || (
                <span className="text-white/40 italic">Sin especificar</span>
              )}
            </Campo>

            {m.experiencia && (
              <Campo icon={<FaUserClock />} label="Experiencia">
                {m.experiencia}
              </Campo>
            )}

            {(m.horarioInicio || m.horarioFin) && (
              <Campo icon={<FaCalendarAlt />} label="Horario">
                {m.horarioInicio || "—"} a {m.horarioFin || "—"}
                {m.diasDisponibles && (
                  <span className="text-white/55 ml-2 text-xs">
                    ({m.diasDisponibles})
                  </span>
                )}
              </Campo>
            )}
          </div>

          {m.descripcion && (
            <div className="md:col-span-2 mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-1">
                Descripción del mecánico
              </div>
              <p className="text-sm text-white/80 italic">"{m.descripcion}"</p>
            </div>
          )}

          {fotos.length > 0 && (
            <div className="md:col-span-2 mt-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-2">
                Fotos del taller ({fotos.length})
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {fotos.map((foto, i) => (
                  <a
                    key={i}
                    href={foto}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 w-32 h-24 rounded-xl overflow-hidden border border-white/15 hover:ring-2 hover:ring-accent transition-all"
                  >
                    <img
                      src={foto}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-5 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-violet-400/40 via-accent/30 to-cyan-400/30 blur-xl opacity-70" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center shadow-2xl text-xl">
              <FaLifeRing />
            </div>
          </div>
          <div>
            <span className="chip-premium">Soporte · Mecánicos</span>
            <h1 className="cliente-headline text-white drop-shadow mt-2">
              Asistencia a <span className="text-gradient-accent">talleres</span>
            </h1>
            <p className="text-sm text-white/65 mt-1">
              Busca un mecánico, restablece su contraseña o suspende la cuenta si
              hay un inconveniente.
            </p>
          </div>
        </div>

        {/* Aviso de límites */}
        <div className="glass-v2 p-4 flex items-start gap-3 border-violet-400/30">
          <div className="w-9 h-9 rounded-xl bg-violet-400/20 text-violet-300 border border-violet-400/40 flex items-center justify-center shrink-0">
            <FaExclamationTriangle />
          </div>
          <div className="text-xs text-white/75 flex-1">
            Como soporte puedes <b className="text-white">suspender / reactivar</b>{" "}
            cuentas y <b className="text-white">restablecer contraseñas</b>. La{" "}
            <b className="text-white">aprobación inicial</b> de mecánicos y la{" "}
            <b className="text-white">eliminación definitiva</b> son funciones
            exclusivas del administrador.
          </div>
        </div>

        {/* Buscador */}
        <div className="glass-v2 p-4 sm:p-5">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, DNI, nombre del local, correo, teléfono..."
              className="input-dark pl-10"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <FaTimes />
              </button>
            )}
          </div>
          {q && (
            <div className="mt-2 text-xs text-white/65">
              <strong className="text-accent-light">{filtrados.length}</strong>{" "}
              {filtrados.length === 1 ? "resultado" : "resultados"} de{" "}
              <strong>{mecanicos.length}</strong> mecánicos totales
            </div>
          )}
        </div>

        {filtrados.length === 0 ? (
          <div className="glass-v2 text-center text-white/65 py-10">
            {q
              ? `No hay mecánicos que coincidan con "${q}".`
              : "Aún no hay mecánicos registrados."}
          </div>
        ) : (
          <div className="space-y-4 stagger">{filtrados.map(renderTarjeta)}</div>
        )}

        {resetModal && (
          <ResetPasswordModal
            mecanico={resetModal}
            onClose={() => setResetModal(null)}
            onSaved={() => {
              setResetModal(null);
              success({
                title: "Contraseña restablecida",
                message: `${resetModal.usuario?.nombre} ya puede iniciar sesión con la nueva contraseña.`,
                emoji: "🔑",
              });
            }}
          />
        )}
      </div>
    </div>
  );
}

function Campo({ icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent-light border border-accent/30 flex items-center justify-center shrink-0 text-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/55">
          {label}
        </div>
        <div className="text-sm text-white font-semibold break-words">
          {children}
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ mecanico, onClose, onSaved }) {
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error("La contraseña debe tener al menos 6 caracteres");
    }
    setGuardando(true);
    try {
      await soporteResetPassword(mecanico.usuario.id, password);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al restablecer");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-v2 w-full max-w-md max-h-[92vh] overflow-y-auto p-6 rounded-t-2xl sm:rounded-3xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-white">
              Restablecer contraseña
            </h3>
            <p className="text-xs text-white/55 mt-0.5">
              {mecanico.usuario?.nombre} · {mecanico.usuario?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label-dark">Nueva contraseña</label>
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark"
              placeholder="Mínimo 6 caracteres"
            />
            <p className="text-xs text-white/55 mt-1">
              Asegúrate de compartir esta contraseña con el mecánico por un
              canal seguro. Pídele que la cambie en cuanto pueda.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="btn-accent flex-1 shine-on-hover"
              disabled={guardando}
            >
              {guardando ? "Guardando..." : "Restablecer"}
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl font-semibold text-white/85 bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
