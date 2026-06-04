// Helpers y constantes compartidas para citas

export const ESTADOS = {
  pendiente: {
    label: "Pendiente",
    color: "#F59E0B",
    bg: "bg-estado-pendiente",
    softBg: "bg-amber-50",
    text: "text-amber-700",
  },
  aceptada: {
    label: "Aceptada",
    color: "#1A47B8",
    bg: "bg-estado-aceptada",
    softBg: "bg-blue-50",
    text: "text-blue-700",
  },
  en_proceso: {
    label: "En proceso",
    color: "#7C3AED",
    bg: "bg-estado-proceso",
    softBg: "bg-violet-50",
    text: "text-violet-700",
  },
  finalizada: {
    label: "Finalizada",
    color: "#16A34A",
    bg: "bg-estado-finalizada",
    softBg: "bg-green-50",
    text: "text-green-700",
  },
  cancelada: {
    label: "Cancelada",
    color: "#DC2626",
    bg: "bg-estado-cancelada",
    softBg: "bg-red-50",
    text: "text-red-700",
  },
  rechazada: {
    label: "Rechazada",
    color: "#78716C",
    bg: "bg-estado-rechazada",
    softBg: "bg-stone-50",
    text: "text-stone-700",
  },
};

export function estadoMeta(estado) {
  return ESTADOS[estado] || ESTADOS.pendiente;
}

// "YYYY-MM-DD" → Date local sin zona horaria
export function parseFecha(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function mismoDia(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const DIAS_CORTOS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DIAS_MIN_ES = ["D", "L", "M", "X", "J", "V", "S"];

// Devuelve los citas que están "vigentes" (no terminadas ni canceladas/rechazadas)
// ordenadas por fecha+hora ascendente, futuras primero.
export function proximaCita(citas) {
  if (!citas || citas.length === 0) return null;
  const ahora = new Date();
  const futuras = citas
    .filter((c) => ["pendiente", "aceptada", "en_proceso"].includes(c.estado))
    .map((c) => ({
      ...c,
      _dt: combinarFechaHora(c.fecha, c.hora),
    }))
    .filter((c) => c._dt && c._dt.getTime() >= ahora.getTime() - 24 * 3600 * 1000)
    .sort((a, b) => a._dt - b._dt);
  return futuras[0] || null;
}

export function combinarFechaHora(fecha, hora) {
  if (!fecha) return null;
  const f = parseFecha(fecha);
  if (!f) return null;
  if (!hora) return f;
  const [h, m] = hora.split(":").map(Number);
  f.setHours(h || 0, m || 0, 0, 0);
  return f;
}

export function tiempoRestante(target) {
  if (!target) return "";
  const ahora = new Date();
  const diff = target.getTime() - ahora.getTime();
  if (diff < 0) {
    const horas = Math.abs(diff) / 3600000;
    if (horas < 24) return "Hoy (ya pasó la hora)";
    return "";
  }
  const min = Math.floor(diff / 60000);
  if (min < 60) return `en ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `en ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "mañana";
  if (d < 7) return `en ${d} días`;
  return `en ${d} días`;
}
