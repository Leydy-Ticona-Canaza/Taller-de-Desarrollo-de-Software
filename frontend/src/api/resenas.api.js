import api from "./axios";

export async function crearResena(data) {
  const r = await api.post("/resenas", data);
  return r.data;
}

export async function resenasMecanico(mecanicoId) {
  const r = await api.get(`/resenas/mecanico/${mecanicoId}`);
  return r.data;
}

export async function eliminarResena(id) {
  const r = await api.delete(`/resenas/${id}`);
  return r.data;
}
