import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaCamera, FaTrash, FaSpinner } from "react-icons/fa";
import {
  subirFotoPerfilRequest,
  borrarFotoPerfilRequest,
} from "../api/auth.api";
import { useConfirm } from "../context/ConfirmContext.jsx";

/**
 * Avatar grande clickeable que muestra la foto del usuario y permite subirla.
 * - Si hay foto: muestra <img>. Hover muestra botón "Cambiar".
 * - Si no hay foto: muestra inicial. Hover muestra ícono cámara.
 * - Acepta drag & drop directo sobre el círculo.
 *
 * Props:
 *   fotoUrl: string | null  → URL actual de la foto
 *   nombre: string          → nombre para inicial cuando no hay foto
 *   onChange: (usuarioActualizado) => void   → callback con el usuario actualizado
 *   size: number            → diámetro en px (default 112)
 */
export default function AvatarUploader({
  fotoUrl,
  nombre,
  onChange,
  size = 112,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const confirm = useConfirm();
  const inicial = (nombre || "?").charAt(0).toUpperCase();

  async function subir(file) {
    if (!file) return;
    // Validación amplia: o bien el browser detecta image/*, o bien la extensión está en la lista
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const extOk = [
      "jpg", "jpeg", "jpe", "jfif",
      "png", "webp", "gif", "avif", "bmp",
      "tif", "tiff", "heic", "heif", "ico",
    ].includes(ext);
    const mimeOk = file.type?.startsWith("image/");
    if (!extOk && !mimeOk) {
      toast.error("Formato no soportado. Usa JPG, PNG, WEBP, GIF, AVIF, BMP, TIFF, HEIC o ICO.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La foto supera los 10 MB");
      return;
    }
    setUploading(true);
    try {
      const u = await subirFotoPerfilRequest(file);
      onChange(u);
      toast.success("Foto actualizada");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al subir la foto");
    } finally {
      setUploading(false);
    }
  }

  async function borrar(e) {
    e.stopPropagation();
    const ok = await confirm({
      title: "¿Eliminar foto de perfil?",
      message:
        "Tu avatar volverá a mostrarse con la inicial de tu nombre. Esta acción se puede deshacer subiendo otra foto.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tipo: "danger",
    });
    if (!ok) return;
    setUploading(true);
    try {
      const u = await borrarFotoPerfilRequest();
      onChange(u);
      toast.success("Foto eliminada");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al borrar la foto");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) subir(f);
  }

  const tamano = { width: `${size}px`, height: `${size}px` };
  const fontSize = `${Math.round(size * 0.4)}px`;

  return (
    <div className="relative inline-block group" style={tamano}>
      {/* Glow detrás */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-accent/40 via-cyan-400/30 to-purple-400/30 blur-xl opacity-70 pointer-events-none" />

      {/* Círculo / cuadro principal — drop zone clickeable */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/40 cursor-pointer transition-all ${
          dragOver ? "ring-accent scale-105" : ""
        } ${uploading ? "cursor-wait" : ""}`}
        style={tamano}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subir(f);
            e.target.value = "";
          }}
        />

        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={nombre || "Avatar"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 font-extrabold flex items-center justify-center"
            style={{ fontSize }}
          >
            {inicial}
          </div>
        )}

        {/* Overlay al hover */}
        <div
          className={`absolute inset-0 flex items-center justify-center gap-2 bg-black/55 backdrop-blur-sm text-white transition-opacity ${
            uploading
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {uploading ? (
            <FaSpinner className="animate-spin text-2xl" />
          ) : (
            <FaCamera className="text-2xl" />
          )}
        </div>
      </div>

      {/* Botón eliminar (solo si hay foto) */}
      {fotoUrl && !uploading && (
        <button
          type="button"
          onClick={borrar}
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white border-2 border-zinc-950 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-10"
          title="Eliminar foto"
        >
          <FaTrash className="text-xs" />
        </button>
      )}

      {/* Botón cambiar (siempre visible al hover, abajo) */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 -bottom-4 px-3 py-1 rounded-full bg-gradient-to-br from-accent to-accent-dark text-zinc-950 text-[10px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap pointer-events-none transition-all ${
          uploading
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {uploading ? "Subiendo..." : "Cambiar foto"}
      </div>
    </div>
  );
}
