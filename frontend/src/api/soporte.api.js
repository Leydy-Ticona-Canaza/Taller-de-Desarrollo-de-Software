import api from "./axios";

export async function soporteDashboard() {
  const r = await api.get("/soporte/dashboard");
  return r.data;
}

export async function soporteListarUsuarios(params = {}) {
  const r = await api.get("/soporte/usuarios", { params });
  return r.data;
}

export async function soporteCrearUsuario(data) {
  const r = await api.post("/soporte/usuarios", data);
  return r.data;
}

export async function soporteEditarUsuario(id, data) {
  const r = await api.put(`/soporte/usuarios/${id}`, data);
  return r.data;
}

export async function soporteCambiarEstadoUsuario(id, activo) {
  const r = await api.put(`/soporte/usuarios/${id}/estado`, { activo });
  return r.data;
}

export async function soporteResetPassword(id, password) {
  const r = await api.post(`/soporte/usuarios/${id}/reset-password`, {
    password,
  });
  return r.data;
}

export async function soporteListarResenas(params = {}) {
  const r = await api.get("/soporte/resenas", { params });
  return r.data;
}

export async function soporteEliminarResena(id) {
  const r = await api.delete(`/soporte/resenas/${id}`);
  return r.data;
}

export async function soporteListarMecanicos() {
  const r = await api.get("/soporte/mecanicos");
  return r.data;
}
