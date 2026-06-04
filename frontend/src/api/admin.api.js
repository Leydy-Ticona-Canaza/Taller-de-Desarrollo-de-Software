import api from "./axios";

export async function adminDashboard() {
  const r = await api.get("/admin/dashboard");
  return r.data;
}

export async function adminListarUsuarios(params = {}) {
  const r = await api.get("/admin/usuarios", { params });
  return r.data;
}

export async function adminCrearUsuario(data) {
  const r = await api.post("/admin/usuarios", data);
  return r.data;
}

export async function adminEditarUsuario(id, data) {
  const r = await api.put(`/admin/usuarios/${id}`, data);
  return r.data;
}

export async function adminBorrarUsuario(id) {
  const r = await api.delete(`/admin/usuarios/${id}`);
  return r.data;
}

export async function adminCambiarEstadoUsuario(id, activo) {
  const r = await api.put(`/admin/usuarios/${id}/estado`, { activo });
  return r.data;
}

export async function adminListarMecanicos() {
  const r = await api.get("/admin/mecanicos");
  return r.data;
}

export async function adminAprobarMecanico(id) {
  const r = await api.put(`/admin/mecanicos/${id}/aprobar`);
  return r.data;
}

export async function adminSuspenderMecanico(id) {
  const r = await api.put(`/admin/mecanicos/${id}/suspender`);
  return r.data;
}
