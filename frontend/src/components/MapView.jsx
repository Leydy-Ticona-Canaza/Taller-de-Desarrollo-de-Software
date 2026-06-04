import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaDirections } from "react-icons/fa";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ lat, lng, label, height = 280 }) {
  if (lat == null || lng == null) return null;

  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="space-y-2">
      <div
        className="rounded-2xl overflow-hidden border border-slate-200 shadow-soft"
        style={{ height }}
      >
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]}>
            {label && <Popup>{label}</Popup>}
          </Marker>
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary px-4 py-2 text-sm"
        >
          <FaDirections /> Cómo llegar (Google Maps)
        </a>
        <a
          href={osmUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost px-4 py-2 text-sm"
        >
          Abrir en OpenStreetMap
        </a>
      </div>
    </div>
  );
}
