import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaArrowRight } from "react-icons/fa";
import StarRating from "./StarRating.jsx";
import { formatKm } from "../utils/geo";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const iconoTaller = L.divIcon({
  className: "",
  html: `<div style="background:#1A47B8;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-size:14px;font-weight:bold;">🔧</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const iconoYo = L.divIcon({
  className: "",
  html: `<div style="background:#F59E0B;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(245,158,11,0.35);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Fit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

export default function MecanicosMap({ mecanicos, miPos, height = 500 }) {
  const conCoords = mecanicos.filter(
    (m) => m.latitud != null && m.longitud != null,
  );
  const puntos = [
    ...conCoords.map((m) => [m.latitud, m.longitud]),
    ...(miPos ? [[miPos.lat, miPos.lng]] : []),
  ];
  const centro = puntos[0] || [-12.0464, -77.0428];

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-soft"
      style={{ height }}
    >
      <MapContainer
        center={centro}
        zoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {miPos && (
          <Marker position={[miPos.lat, miPos.lng]} icon={iconoYo}>
            <Popup>Tú estás aquí</Popup>
          </Marker>
        )}
        {conCoords.map((m) => (
          <Marker
            key={m.id}
            position={[m.latitud, m.longitud]}
            icon={iconoTaller}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[180px]">
                <div className="font-bold text-primary-dark">
                  {m.usuario?.nombre}
                </div>
                <StarRating value={m.calificacionPromedio || 0} />
                {m.ubicacion && (
                  <div className="text-xs text-slate-600">{m.ubicacion}</div>
                )}
                {m.distancia != null && (
                  <div className="text-xs text-primary font-semibold">
                    A {formatKm(m.distancia)} de ti
                  </div>
                )}
                <Link
                  to={`/mecanico/${m.id}`}
                  className="btn-primary text-xs w-full mt-2 py-1.5"
                >
                  Ver perfil <FaArrowRight />
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        {puntos.length > 1 && <Fit points={puntos} />}
      </MapContainer>
    </div>
  );
}
