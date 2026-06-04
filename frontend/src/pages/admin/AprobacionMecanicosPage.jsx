import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaCheck,
  FaBan,
  FaMapMarkerAlt,
  FaTools,
  FaStore,
  FaIdCard,
  FaPhone,
  FaEnvelope,
  FaTruck,
  FaCalendarAlt,
  FaUserClock,
  FaClipboardCheck,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import {
  adminListarMecanicos,
  adminAprobarMecanico,
  adminSuspenderMecanico,
  adminBorrarUsuario,
} from "../../api/admin.api";
import StarRating from "../../components/StarRating.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";

export default function AprobacionMecanicosPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const success = useSuccess();
  const [q, setQ] = useState("");

  const { data: mecanicos = [], isLoading } = useQuery({
    queryKey: ["admin-mecanicos"],
    queryFn: adminListarMecanicos,
  });

  const aprobarMut = useMutation({
    mutationFn: adminAprobarMecanico,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mecanicos"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      success({
        title: "Mecánico aprobado",
        message: "Ahora aparecerá en las búsquedas de los clientes.",
        emoji: "✅",
      });
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error"),
  });

  const suspenderMut = useMutation({
    mutationFn: adminSuspenderMecanico,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mecanicos"] });
      success({
        title: "Mecánico suspendido",
        message:
          "El mecánico ya no aparecerá en las búsquedas hasta volver a aprobarlo.",
        emoji: "🚫",
      });
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error"),
  });

  const eliminarMut = useMutation({
    mutationFn: adminBorrarUsuario,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mecanicos"] });
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      success({
        title: "Mecánico eliminado",
        message:
          "La cuenta y el perfil del taller fueron eliminados del sistema.",
        emoji: "🗑️",
      });
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error al eliminar"),
  });

  async function confirmarAprobar(m) {
    const ok = await confirm({
      title: "¿Aprobar a este mecánico?",
      message: `Vas a aprobar a:\n\n${m.usuario?.nombre}\n${m.usuario?.email}\n\nUna vez aprobado podrá recibir reservas de los clientes.`,
      confirmText: "Sí, aprobar",
      cancelText: "Cancelar",
      tipo: "wrench",
      colorBoton: "success",
    });
    if (ok) aprobarMut.mutate(m.id);
  }

  async function confirmarSuspender(m) {
    const ok = await confirm({
      title: "¿Suspender a este mecánico?",
      message: `Vas a suspender a:\n\n${m.usuario?.nombre}\n${m.usuario?.email}\n\nDejará de aparecer en las búsquedas pero su cuenta seguirá activa.`,
      confirmText: "Sí, suspender",
      cancelText: "Cancelar",
      tipo: "danger",
    });
    if (ok) suspenderMut.mutate(m.id);
  }

  async function confirmarEliminar(m) {
    const ok = await confirm({
      title: "¿Eliminar este mecánico DEFINITIVAMENTE?",
      message: `Vas a eliminar para siempre a:\n\n${m.usuario?.nombre}\n${m.usuario?.email}\nDNI: ${m.usuario?.dni || "—"}\nLocal: ${m.nombreLocal || "—"}\n\nEsto borra la cuenta del usuario y TODOS sus datos (perfil, servicios, citas y reseñas). Esta acción NO se puede deshacer.`,
      confirmText: "Sí, eliminar para siempre",
      cancelText: "Cancelar",
      tipo: "danger",
    });
    if (ok && m.usuario?.id) eliminarMut.mutate(m.usuario.id);
  }

  if (isLoading) return <LoadingSpinner />;

  // Filtrado por DNI / nombreLocal / nombre / email (case-insensitive)
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
  const pendientes = filtrados.filter((m) => !m.aprobado);
  const aprobados = filtrados.filter((m) => m.aprobado);
  const totalPendientes = mecanicos.filter((m) => !m.aprobado).length;
  const totalAprobados = mecanicos.filter((m) => m.aprobado).length;

  function renderTarjeta(m) {
    const fotos = (m.fotosReferencia || "").split(",").filter(Boolean);
    const fechaRegistro = m.usuario?.fechaRegistro
      ? new Date(m.usuario.fechaRegistro).toLocaleDateString("es-PE", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : null;

    return (
      <div key={m.id} className="glass-v2 p-0 overflow-hidden">
        {/* Encabezado coloreado según estado */}
        <div
          className={`px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b ${
            m.aprobado
              ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border-emerald-400/25"
              : "bg-gradient-to-r from-amber-400/20 to-amber-400/5 border-amber-400/30"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 font-extrabold text-lg flex items-center justify-center shadow-lg shrink-0">
              {m.usuario?.nombre?.charAt(0) || "M"}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-white truncate">
                {m.usuario?.nombre}
              </h3>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${
                    m.aprobado
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                      : "bg-amber-400/25 text-amber-200 border border-amber-400/40"
                  }`}
                >
                  {m.aprobado ? "Aprobado" : "Pendiente de aprobación"}
                </span>
                {m.esMovil && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-accent/20 text-accent-light border border-accent/40">
                    <FaTruck /> A domicilio
                  </span>
                )}
                {!m.usuario?.activo && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-300 border border-red-400/40">
                    Cuenta inactiva
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!m.aprobado ? (
              <button
                onClick={() => confirmarAprobar(m)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-950 bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 shadow-[0_8px_24px_-10px_rgba(16,185,129,0.6)] transition-all inline-flex items-center gap-1.5"
              >
                <FaCheck /> Aprobar
              </button>
            ) : (
              <button
                onClick={() => confirmarSuspender(m)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400/50 shadow-[0_8px_24px_-10px_rgba(217,119,6,0.6)] transition-all inline-flex items-center gap-1.5"
                title="Suspender (no aparece en búsquedas, pero su cuenta sigue existiendo)"
              >
                <FaBan /> Suspender
              </button>
            )}
            <button
              onClick={() => confirmarEliminar(m)}
              className="px-3 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border border-red-400/50 shadow-[0_8px_24px_-10px_rgba(220,38,38,0.6)] transition-all inline-flex items-center gap-1.5"
              title="Eliminar definitivamente (último recurso)"
            >
              <FaTrash />
            </button>
          </div>
        </div>

        {/* Cuerpo: información del mecánico */}
        <div className="p-5 grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {/* Identidad y contacto */}
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

          {/* Datos del taller */}
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

          {/* Descripción full-width */}
          {m.descripcion && (
            <div className="md:col-span-2 mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 mb-1">
                Descripción / mensaje del mecánico
              </div>
              <p className="text-sm text-white/80 italic">"{m.descripcion}"</p>
            </div>
          )}

          {/* Galería de fotos */}
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

      <div className="relative max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-rose-400/40 via-accent/30 to-cyan-400/30 blur-xl opacity-70" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-2xl text-xl">
              <FaClipboardCheck />
            </div>
          </div>
          <div>
            <span className="chip-premium">Admin · Aprobaciones</span>
            <h1 className="cliente-headline text-white drop-shadow mt-2">
              Aprobación de <span className="text-gradient-accent">mecánicos</span>
            </h1>
            <p className="text-sm text-white/65 mt-1">
              Revisa la información que cada mecánico llenó al registrarse antes
              de aprobar su cuenta.
            </p>
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
                title="Limpiar búsqueda"
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

        <section>
          <h2 className="text-lg font-extrabold text-amber-300 mb-3 inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            Pendientes ({pendientes.length}
            {q && pendientes.length !== totalPendientes && (
              <span className="text-white/55"> / {totalPendientes}</span>
            )}
            )
          </h2>
          {pendientes.length === 0 ? (
            <div className="glass-v2 text-center text-white/65 py-8">
              {q
                ? `No hay pendientes que coincidan con "${q}".`
                : "No hay mecánicos pendientes de aprobación."}
            </div>
          ) : (
            <div className="space-y-4 stagger">{pendientes.map(renderTarjeta)}</div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-emerald-300 mb-3 inline-flex items-center gap-2">
            <FaCheck /> Aprobados ({aprobados.length}
            {q && aprobados.length !== totalAprobados && (
              <span className="text-white/55"> / {totalAprobados}</span>
            )}
            )
          </h2>
          {aprobados.length === 0 ? (
            <div className="glass-v2 text-center text-white/65 py-8">
              {q
                ? `No hay aprobados que coincidan con "${q}".`
                : "Aún no hay mecánicos aprobados."}
            </div>
          ) : (
            <div className="space-y-4 stagger">{aprobados.map(renderTarjeta)}</div>
          )}
        </section>
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
