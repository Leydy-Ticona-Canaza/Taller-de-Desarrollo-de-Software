import api from "./axios";

export async function listarMecanicos(params = {}) {
  const r = await api.get("/mecanicos", { params });
  return r.data;
}

export async function detalleMecanico(id) {
  const r = await api.get(`/mecanicos/${id}`);
  return r.data;
}

export async function actualizarPerfilMecanico(data) {
  const r = await api.put("/mecanicos/perfil", data);
  return r.data;
}

export async function dashboardMecanico() {
  const r = await api.get("/mecanicos/dashboard");
  return r.data;
}
