import api from "./axios";

export async function crearCita(data) {
  const r = await api.post("/citas", data);
  return r.data;
}

export async function misCitas() {
  const r = await api.get("/citas/mis-citas");
  return r.data;
}

export async function citasMecanico() {
  const r = await api.get("/citas/mecanico");
  return r.data;
}

export async function cambiarEstadoCita(id, estado) {
  const r = await api.put(`/citas/${id}/estado`, { estado });
  return r.data;
}

export async function cancelarCita(id) {
  const r = await api.put(`/citas/${id}/cancelar`);
  return r.data;
}

export async function horariosOcupados(mecanicoId, fecha) {
  const r = await api.get(`/citas/ocupadas/${mecanicoId}`, {
    params: { fecha },
  });
  return r.data; // { mecanicoId, fecha, horasOcupadas: ["08:30", "10:00", ...] }
}
