import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash, FaWrench, FaTimes } from "react-icons/fa";
import {
  listarServiciosMecanico,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  listarCategorias,
} from "../../api/servicios.api";
import api from "../../api/axios";
import ServicioCard from "../../components/ServicioCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const FORM_INICIAL = {
  nombre: "",
  descripcion: "",
  precio: "",
  duracionMinutos: 60,
  categoria: "General",
};

export default function MisServiciosPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  const { data: perfil } = useQuery({
    queryKey: ["perfil-mecanico"],
    queryFn: async () => (await api.get("/auth/perfil")).data,
  });

  const mecanicoId = perfil?.mecanico?.id;

  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ["servicios-propios", mecanicoId],
    queryFn: () => listarServiciosMecanico(mecanicoId),
    enabled: !!mecanicoId,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
  });

  const crearMut = useMutation({
    mutationFn: crearServicio,
    onSuccess: () => {
      toast.success("Servicio creado");
      cerrar();
      qc.invalidateQueries({ queryKey: ["servicios-propios"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }) => actualizarServicio(id, data),
    onSuccess: () => {
      toast.success("Servicio actualizado");
      cerrar();
      qc.invalidateQueries({ queryKey: ["servicios-propios"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const delMut = useMutation({
    mutationFn: eliminarServicio,
    onSuccess: () => {
      toast.success("Servicio eliminado");
      qc.invalidateQueries({ queryKey: ["servicios-propios"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  function abrirNuevo() {
    setEditing(null);
    setForm(FORM_INICIAL);
    setShowModal(true);
  }

  function abrirEditar(s) {
    setEditing(s);
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion || "",
      precio: s.precio,
      duracionMinutos: s.duracionMinutos,
      categoria: s.categoria,
    });
    setShowModal(true);
  }

  function cerrar() {
    setShowModal(false);
    setEditing(null);
    setForm(FORM_INICIAL);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      editMut.mutate({ id: editing.id, data: form });
    } else {
      crearMut.mutate(form);
    }
  }

  if (!perfil) return <LoadingSpinner />;

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-5">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="chip-premium">
              <FaWrench /> Catálogo
            </span>
            <h1 className="cliente-headline text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)] mt-2">
              Mis <span className="text-gradient-accent">servicios</span>
            </h1>
            <p className="text-sm text-white/65 mt-1">
              Crea, edita y publica los servicios que ofreces a los clientes.
            </p>
          </div>
          <button
            onClick={abrirNuevo}
            className="btn-accent shine-on-hover"
          >
            <FaPlus /> Nuevo servicio
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : servicios.length === 0 ? (
          <div className="glass-v2 text-center text-white/65 py-10">
            <FaWrench className="mx-auto text-4xl text-white/30 mb-3" />
            <p className="font-semibold text-white">
              Aún no has creado servicios
            </p>
            <p className="text-sm mt-1">
              Haz clic en "Nuevo servicio" para empezar a recibir clientes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {servicios.map((s) => (
              <ServicioCard
                key={s.id}
                servicio={s}
                actions={
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEditar(s)}
                      className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white/85 bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all inline-flex items-center gap-1.5"
                    >
                      <FaEdit /> Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${s.nombre}"?`))
                          delMut.mutate(s.id);
                      }}
                      className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border border-red-400/50 transition-all"
                    >
                      <FaTrash />
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 animate-fade-in">
            <form
              onSubmit={handleSubmit}
              className="glass-v2 w-full max-w-md p-6 space-y-3 animate-scale-in"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <FaWrench className="text-accent-light" />
                  {editing ? "Editar servicio" : "Nuevo servicio"}
                </h3>
                <button
                  type="button"
                  onClick={cerrar}
                  className="text-white/60 hover:text-white text-xl"
                  aria-label="Cerrar"
                >
                  <FaTimes />
                </button>
              </div>
              <div>
                <label className="label-dark">Nombre</label>
                <input
                  required
                  className="input-dark"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="label-dark">Descripción</label>
                <textarea
                  rows={3}
                  className="input-dark"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label-dark">Precio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-dark"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-dark">Duración (min)</label>
                  <input
                    type="number"
                    required
                    className="input-dark"
                    value={form.duracionMinutos}
                    onChange={(e) =>
                      setForm({ ...form, duracionMinutos: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label-dark">Categoría</label>
                <select
                  className="input-dark"
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value })
                  }
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn-accent flex-1 shine-on-hover" type="submit">
                  {editing ? "Guardar" : "Crear"}
                </button>
                <button
                  type="button"
                  onClick={cerrar}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white/85 bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
