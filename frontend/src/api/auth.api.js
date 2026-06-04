import api from "./axios";

export async function loginRequest(data) {
  const r = await api.post("/auth/login", data);
  return r.data;
}

export async function registerRequest(data) {
  const r = await api.post("/auth/register", data);
  return r.data;
}

export async function perfilRequest() {
  const r = await api.get("/auth/perfil");
  return r.data;
}

export async function actualizarPerfilRequest(data) {
  const r = await api.put("/auth/perfil", data);
  return r.data;
}

export async function enviarCodigoRequest(email, proposito) {
  const r = await api.post("/auth/send-code", { email, proposito });
  return r.data;
}

export async function resetPasswordRequest(data) {
  const r = await api.post("/auth/reset-password", data);
  return r.data;
}

export async function subirFotoPerfilRequest(file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await api.post("/auth/perfil/foto", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data;
}

export async function borrarFotoPerfilRequest() {
  const r = await api.delete("/auth/perfil/foto");
  return r.data;
}
