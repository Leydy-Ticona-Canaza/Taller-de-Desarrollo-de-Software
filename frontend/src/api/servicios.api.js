import api from "./axios";

export async function listarCategorias() {
  const r = await api.get("/servicios/categorias");
  return r.data;
}

export async function listarServiciosMecanico(mecanicoId) {
  const r = await api.get(`/servicios/mecanico/${mecanicoId}`);
  return r.data;
}

export async function crearServicio(data) {
  const r = await api.post("/servicios", data);
  return r.data;
}

export async function actualizarServicio(id, data) {
  const r = await api.put(`/servicios/${id}`, data);
  return r.data;
}

export async function eliminarServicio(id) {
  const r = await api.delete(`/servicios/${id}`);
  return r.data;
}
