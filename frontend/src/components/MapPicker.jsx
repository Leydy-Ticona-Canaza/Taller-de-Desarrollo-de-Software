import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaSearch, FaCrosshairs, FaMapMarkerAlt } from "react-icons/fa";

// Arregla el icono por defecto (Vite no resuelve los assets de Leaflet).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [-12.0464, -77.0428]; // Lima, Perú
const DEFAULT_ZOOM = 13;

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], zoom ?? map.getZoom(), { duration: 0.8 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

export default function MapPicker({ lat, lng, onChange, height = 320 }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const markerRef = useRef(null);

  const hasPosition = lat != null && lng != null;
  const center = hasPosition ? [lat, lng] : DEFAULT_CENTER;

  async function buscar(e) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
        encodeURIComponent(query);
      const r = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const data = await r.json();
      if (!data || data.length === 0) {
        setError("No se encontró ese lugar");
        return;
      }
      const { lat: la, lon: lo } = data[0];
      onChange(parseFloat(la), parseFloat(lo));
    } catch {
      setError("No se pudo buscar (revisa tu conexión)");
    } finally {
      setSearching(false);
    }
  }

  function usarMiUbicacion() {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(pos.coords.latitude, pos.coords.longitude),
      () => setError("No se pudo obtener tu ubicación"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function handleMarkerDragEnd() {
    const m = markerRef.current;
    if (m) {
      const { lat: la, lng: lo } = m.getLatLng();
      onChange(la, lo);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                buscar();
              }
            }}
            placeholder="Buscar dirección, ciudad o lugar..."
            className="input pl-10"
          />
        </div>
        <button
          type="button"
          onClick={buscar}
          className="btn-primary px-4"
          disabled={searching}
        >
          {searching ? "..." : "Buscar"}
        </button>
        <button
          type="button"
          onClick={usarMiUbicacion}
          className="btn-outline px-4"
          title="Usar mi ubicación"
        >
          <FaCrosshairs />
        </button>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden border border-slate-200 shadow-soft relative"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={hasPosition ? 15 : DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPosition && (
            <Marker
              draggable
              eventHandlers={{ dragend: handleMarkerDragEnd }}
              position={[lat, lng]}
              ref={markerRef}
            />
          )}
          <ClickHandler onPick={onChange} />
          {hasPosition && <FlyTo lat={lat} lng={lng} zoom={15} />}
        </MapContainer>
      </div>

      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1">
          <FaMapMarkerAlt className="text-primary" />
          {hasPosition
            ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            : "Aún no has seleccionado una ubicación"}
        </span>
        <span>Haz clic en el mapa o arrastra el marcador para ajustar.</span>
      </div>
    </div>
  );
}
