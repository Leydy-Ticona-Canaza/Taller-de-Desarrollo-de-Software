import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const iconoUsuario = L.divIcon({
  className: "",
  html: `<div style="background:#1A47B8;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(26,71,184,0.35);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconoTaller = L.divIcon({
  className: "",
  html: `<div style="background:#F59E0B;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">🔧</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function FitToBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);
  return null;
}

export default function RouteMap({
  origen,
  destino,
  ruta,
  labelDestino,
  height = 360,
}) {
  if (!origen || !destino) return null;

  const polyline = ruta?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
  const todos = [
    [origen.lat, origen.lng],
    [destino.lat, destino.lng],
    ...polyline,
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-soft"
      style={{ height }}
    >
      <MapContainer
        center={[origen.lat, origen.lng]}
        zoom={14}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[origen.lat, origen.lng]} icon={iconoUsuario}>
          <Popup>Tú estás aquí</Popup>
        </Marker>
        <Marker position={[destino.lat, destino.lng]} icon={iconoTaller}>
          <Popup>{labelDestino || "Taller"}</Popup>
        </Marker>
        {polyline.length > 0 && (
          <>
            <Polyline
              positions={polyline}
              pathOptions={{ color: "white", weight: 8, opacity: 0.9 }}
            />
            <Polyline
              positions={polyline}
              pathOptions={{ color: "#1A47B8", weight: 5, opacity: 1 }}
            />
          </>
        )}
        <FitToBounds points={todos} />
      </MapContainer>
    </div>
  );
}
