// Haversine — distancia en km entre dos puntos lat/lng
export function distanciaKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null)) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatKm(km) {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// Traduce las instrucciones de OSRM al español con flechas Unicode
const MANIOBRAS = {
  "depart": { texto: "Sal", icono: "🏁" },
  "arrive": { texto: "Llegaste a tu destino", icono: "🎯" },
  "turn|left": { texto: "Gira a la izquierda", icono: "⬅️" },
  "turn|right": { texto: "Gira a la derecha", icono: "➡️" },
  "turn|sharp left": { texto: "Gira bruscamente a la izquierda", icono: "↙️" },
  "turn|sharp right": { texto: "Gira bruscamente a la derecha", icono: "↘️" },
  "turn|slight left": { texto: "Gira ligeramente a la izquierda", icono: "↖️" },
  "turn|slight right": { texto: "Gira ligeramente a la derecha", icono: "↗️" },
  "turn|straight": { texto: "Sigue recto", icono: "⬆️" },
  "turn|uturn": { texto: "Da media vuelta", icono: "↩️" },
  "continue|straight": { texto: "Continúa recto", icono: "⬆️" },
  "continue|left": { texto: "Continúa a la izquierda", icono: "⬅️" },
  "continue|right": { texto: "Continúa a la derecha", icono: "➡️" },
  "merge|left": { texto: "Incorpórate por la izquierda", icono: "↖️" },
  "merge|right": { texto: "Incorpórate por la derecha", icono: "↗️" },
  "merge|straight": { texto: "Incorpórate recto", icono: "⬆️" },
  "on ramp|left": { texto: "Toma la rampa de la izquierda", icono: "↖️" },
  "on ramp|right": { texto: "Toma la rampa de la derecha", icono: "↗️" },
  "off ramp|left": { texto: "Sal por la rampa de la izquierda", icono: "↖️" },
  "off ramp|right": { texto: "Sal por la rampa de la derecha", icono: "↗️" },
  "fork|left": { texto: "En la bifurcación, ve por la izquierda", icono: "↖️" },
  "fork|right": { texto: "En la bifurcación, ve por la derecha", icono: "↗️" },
  "fork|straight": { texto: "En la bifurcación, sigue recto", icono: "⬆️" },
  "end of road|left": { texto: "Al final del camino, ve a la izquierda", icono: "⬅️" },
  "end of road|right": { texto: "Al final del camino, ve a la derecha", icono: "➡️" },
  "roundabout": { texto: "Toma la rotonda", icono: "🔄" },
  "rotary": { texto: "Toma la glorieta", icono: "🔄" },
  "exit roundabout": { texto: "Sal de la rotonda", icono: "↗️" },
  "exit rotary": { texto: "Sal de la glorieta", icono: "↗️" },
  "new name|straight": { texto: "Continúa recto", icono: "⬆️" },
  "notification|straight": { texto: "Continúa recto", icono: "⬆️" },
};

export function traducirManiobra(step) {
  const m = step.maneuver || {};
  const tipo = m.type || "";
  const mod = m.modifier || "";
  const key = `${tipo}|${mod}`;
  const calle = step.name || "";
  const base =
    MANIOBRAS[key] ||
    MANIOBRAS[tipo] ||
    { texto: tipo.replace(/-/g, " ") || "Continúa", icono: "➡️" };

  let texto = base.texto;
  if (tipo === "depart" && calle) texto = `Sal por ${calle}`;
  else if (tipo === "arrive") texto = "Has llegado a tu destino";
  else if (calle && tipo !== "depart" && tipo !== "arrive") texto += ` en ${calle}`;

  return { ...base, texto };
}
