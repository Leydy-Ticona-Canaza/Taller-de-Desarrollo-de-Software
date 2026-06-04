import { useCallback, useState } from "react";

export default function useGeolocation() {
  const [pos, setPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy });
        setLoading(false);
      },
      (e) => {
        const msgs = {
          1: "Diste denegado el permiso de ubicación. Actívalo en tu navegador.",
          2: "No se pudo obtener tu ubicación (señal débil).",
          3: "Tiempo agotado al pedir tu ubicación.",
        };
        setError(msgs[e.code] || "Error al pedir tu ubicación");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  return { pos, loading, error, locate, setPos };
}
