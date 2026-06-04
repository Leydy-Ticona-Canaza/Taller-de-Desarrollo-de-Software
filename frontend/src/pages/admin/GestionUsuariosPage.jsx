import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaUserPlus,
  FaUsers,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUserShield,
  FaUserCog,
  FaUserTie,
  FaUser,
  FaFilter,
} from "react-icons/fa";
import {
  adminListarUsuarios,
  adminCrearUsuario,
  adminEditarUsuario,
  adminBorrarUsuario,
  adminCambiarEstadoUsuario,
} from "../../api/admin.api";
import { useAuth } from "../../context/AuthContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import { useSuccess } from "../../context/SuccessContext.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const ROLES = [
  {
    v: "cliente",
    t: "Cliente",
    chip: "bg-cyan-400/15 text-cyan-300 border border-cyan-300/30",
    icon: <FaUser />,
  },
  {
    v: "mecanico",
    t: "Mecánico",
    chip: "bg-accent/15 text-accent-light border border-accent/30",
    icon: <FaUserCog />,
  },
  {
    v: "admin",
    t: "Admin",
    chip: "bg-rose-400/15 text-rose-300 border border-rose-300/30",
    icon: <FaUserShield />,
  },
  {
    v: "soporte",
    t: "Soporte",
    chip: "bg-violet-400/15 text-violet-300 border border-violet-300/30",
    icon: <FaUserTie />,
  },
];

function rolMeta(rol) {
  return ROLES.find((r) => r.v === rol) || ROLES[0];
}

export default function GestionUsuariosPage() {
  const qc = useQueryClient();
  const { usuario: yo } = useAuth();
  const confirm = useConfirm();
  const success = useSuccess();
  const [q, setQ] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [activoFiltro, setActivoFiltro] = useState("");
  const [modal, setModal] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (q) p.q = q;
    if (rolFiltro) p.rol = rolFiltro;
    if (activoFiltro !== "") p.activo = activoFiltro;
    return p;
  }, [q, rolFiltro, activoFiltro]);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["admin-usuarios", params],
    queryFn: () => adminListarUsuarios(params),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-usuarios"] });

  const mutEstado = useMutation({
    mutationFn: ({ id, activo }) => adminCambiarEstadoUsuario(id, activo),
    onSuccess: () => {
      toast.success("Estado actualizado");
      invalidate();
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error"),
  });

  const mutBorrar = useMutation({
    mutationFn: adminBorrarUsuario,
    onSuccess: () => {
      invalidate();
      success({
        title: "Usuario eliminado",
        message: "El usuario ha sido removido del sistema.",
        emoji: "🗑️",
      });
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error"),
  });

  async function confirmarBorrar(u) {
    if (u.id === yo.id) return toast.error("No puedes eliminarte a ti mismo");
    const ok = await confirm({
      title: "¿Eliminar usuario?",
      message: `Vas a eliminar a:\n\n${u.nombre}\n${u.email}\nRol: ${u.rol}\n\nEsta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tipo: "danger",
    });
    if (ok) mutBorrar.mutate(u.id);
  }

  const conteoActivo = usuarios.filter((u) => u.activo).length;
  const hayFiltros = q || rolFiltro || activoFiltro !== "";

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-5 animate-fade-in-up">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-rose-400/40 via-accent/30 to-cyan-400/30 blur-xl opacity-70" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-2xl text-xl">
                <FaUsers />
              </div>
            </div>
            <div>
              <span className="chip-premium">Admin · Usuarios</span>
              <h1 className="cliente-headline text-white drop-shadow mt-2">
                Gestión de <span className="text-gradient-accent">usuarios</span>
              </h1>
              <p className="text-sm text-white/65 mt-1">
                <strong className="text-accent-light">{usuarios.length}</strong>{" "}
                {usuarios.length === 1 ? "usuario" : "usuarios"}
                {hayFiltros ? " (filtrados)" : ""} ·{" "}
                <span className="text-emerald-300 font-semibold">
                  {conteoActivo}
                </span>{" "}
                activos
              </p>
            </div>
          </div>
          <button
            onClick={() => setModal({ modo: "crear" })}
            className="btn-accent shine-on-hover"
          >
            <FaUserPlus /> Crear usuario
          </button>
        </div>

        {/* Filtros */}
        <div className="glass-v2 p-5 space-y-3">
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, correo o teléfono..."
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
            <select
              value={activoFiltro}
              onChange={(e) => setActivoFiltro(e.target.value)}
              className="input-dark min-w-[150px]"
            >
              <option value="">Todos</option>
              <option value="true">Solo activos</option>
              <option value="false">Solo inactivos</option>
            </select>
            {hayFiltros && (
              <button
                onClick={() => {
                  setQ("");
                  setRolFiltro("");
                  setActivoFiltro("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white/85 bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all"
              >
                Limpiar
              </button>
            )}
          </div>

          <div>
            <div className="text-xs font-bold text-white/55 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
              <FaFilter /> Filtrar por rol
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setRolFiltro("")}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  rolFiltro === ""
                    ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                    : "bg-white/5 text-white/85 border-white/15 hover:border-accent/50 hover:bg-white/10 backdrop-blur"
                }`}
              >
                Todos
              </button>
              {ROLES.map((r) => (
                <button
                  key={r.v}
                  onClick={() => setRolFiltro(r.v === rolFiltro ? "" : r.v)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    rolFiltro === r.v
                      ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                      : "bg-white/5 text-white/85 border-white/15 hover:border-accent/50 hover:bg-white/10 backdrop-blur"
                  }`}
                >
                  {r.icon} {r.t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <LoadingSpinner />
        ) : usuarios.length === 0 ? (
          <div className="glass-v2 text-center py-10">
            <FaUsers className="mx-auto text-4xl text-white/30 mb-2" />
            <p className="text-white/65">No hay usuarios con esos filtros.</p>
          </div>
        ) : (
          <>
            {/* Vista móvil: cards */}
            <div className="space-y-3 sm:hidden">
              {usuarios.map((u) => {
                const meta = rolMeta(u.rol);
                const esYo = u.id === yo.id;
                return (
                  <div key={u.id} className="glass-v2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-extrabold text-white truncate">
                          {u.nombre}{" "}
                          {esYo && (
                            <span className="text-xs text-accent-light">
                              (tú)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/60 truncate">
                          {u.email}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full shrink-0 ${meta.chip}`}
                      >
                        {meta.icon} <span>{meta.t}</span>
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-white/55 grid grid-cols-2 gap-y-1">
                      <span>Tel: {u.telefono || "—"}</span>
                      <span>
                        Reg:{" "}
                        {new Date(u.fechaRegistro).toLocaleDateString("es")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                      <ToggleActivo
                        activo={u.activo}
                        disabled={esYo && u.activo}
                        onChange={(v) =>
                          mutEstado.mutate({ id: u.id, activo: v })
                        }
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setModal({ modo: "editar", user: u })}
                          className="w-9 h-9 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 hover:border-accent/50 transition-all text-white/85 flex items-center justify-center"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => confirmarBorrar(u)}
                          className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-400/40 hover:bg-red-500/25 transition-all text-red-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={esYo}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista desktop: tabla */}
            <div className="glass-v2 overflow-x-auto p-0 hidden sm:block">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-left text-[10px] uppercase tracking-[0.18em] text-white/55 font-bold">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3 hidden lg:table-cell">DNI</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3 hidden xl:table-cell">Teléfono</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Registro</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const meta = rolMeta(u.rol);
                    const esYo = u.id === yo.id;
                    return (
                      <tr
                        key={u.id}
                        className="border-t border-white/8 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 font-bold flex items-center justify-center shrink-0 shadow-md">
                              {u.nombre?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">
                                {u.nombre}{" "}
                                {esYo && (
                                  <span className="text-[10px] text-accent-light uppercase tracking-wider">
                                    (tú)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/75 truncate max-w-[200px]">
                          {u.email}
                        </td>
                        <td className="px-4 py-3 text-white/75 hidden lg:table-cell">
                          {u.dni || (
                            <span className="text-white/35 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${meta.chip}`}
                          >
                            {meta.icon} <span>{meta.t}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/75 hidden xl:table-cell">
                          {u.telefono || "—"}
                        </td>
                        <td className="px-4 py-3 text-white/55 hidden lg:table-cell">
                          {new Date(u.fechaRegistro).toLocaleDateString("es")}
                        </td>
                        <td className="px-4 py-3">
                          <ToggleActivo
                            activo={u.activo}
                            disabled={esYo && u.activo}
                            onChange={(v) =>
                              mutEstado.mutate({ id: u.id, activo: v })
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() =>
                                setModal({ modo: "editar", user: u })
                              }
                              className="w-9 h-9 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 hover:border-accent/50 transition-all text-white/85 flex items-center justify-center"
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => confirmarBorrar(u)}
                              className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-400/40 hover:bg-red-500/25 transition-all text-red-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={esYo}
                              title="Eliminar"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {modal && (
          <UsuarioModal
            modo={modal.modo}
            user={modal.user}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              invalidate();
            }}
          />
        )}
      </div>
    </div>
  );
}

function ToggleActivo({ activo, onChange, disabled }) {
  return (
    <label
      className={`inline-flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={!!activo}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-white/15 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5 shadow-inner" />
      <span className="ml-2 text-xs font-bold text-white/80">
        {activo ? "Activo" : "Inactivo"}
      </span>
    </label>
  );
}

function UsuarioModal({ modo, user, onClose, onSaved }) {
  const editando = modo === "editar";
  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    email: user?.email || "",
    telefono: user?.telefono || "",
    dni: user?.dni || "",
    rol: user?.rol || "cliente",
    activo: user?.activo ?? true,
    password: "",
  });
  const [guardando, setGuardando] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!editando && form.password.length < 6) {
      return toast.error("La contraseña debe tener al menos 6 caracteres");
    }
    if (editando && form.password && form.password.length < 6) {
      return toast.error("Si cambias la contraseña, mínimo 6 caracteres");
    }
    setGuardando(true);
    try {
      if (editando) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await adminEditarUsuario(user.id, payload);
        toast.success("Usuario actualizado");
      } else {
        await adminCrearUsuario(form);
        toast.success("Usuario creado");
      }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al guardar");
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
              {editando ? "Editar usuario" : "Crear usuario"}
            </h3>
            <p className="text-xs text-white/55 mt-0.5">
              {editando
                ? "Modifica los datos y guarda."
                : "Crea cuentas de cualquier rol, incluyendo administradores."}
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
            <label className="label-dark">Nombre completo</label>
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="input-dark"
            />
          </div>
          <div>
            <label className="label-dark">Correo electrónico</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-dark"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="label-dark">DNI</label>
              <input
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                className="input-dark"
                placeholder="12345678"
              />
            </div>
            <div>
              <label className="label-dark">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) =>
                  setForm({ ...form, telefono: e.target.value })
                }
                className="input-dark"
              />
            </div>
          </div>
          <div>
            <label className="label-dark">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.v}
                  onClick={() => setForm({ ...form, rol: r.v })}
                  className={`inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-xl text-sm font-semibold transition-all ${
                    form.rol === r.v
                      ? "bg-gradient-to-br from-accent to-accent-dark text-zinc-950 border-accent shadow-glow-accent"
                      : "border-white/15 text-white/85 bg-white/5 hover:border-accent/50 hover:bg-white/10 backdrop-blur"
                  }`}
                >
                  {r.icon} {r.t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-dark">
              {editando
                ? "Nueva contraseña (deja en blanco para no cambiar)"
                : "Contraseña"}
            </label>
            <input
              type="password"
              required={!editando}
              minLength={editando ? undefined : 6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-dark"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm font-semibold text-white/85">
              Cuenta activa
            </span>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="btn-accent flex-1 shine-on-hover"
              disabled={guardando}
            >
              {guardando ? "Guardando..." : editando ? "Guardar" : "Crear"}
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
