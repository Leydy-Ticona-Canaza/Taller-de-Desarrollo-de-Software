import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaCloudUploadAlt, FaTimes, FaImages } from "react-icons/fa";
import api from "../api/axios";
import { useConfirm } from "../context/ConfirmContext.jsx";

const MAX = 6;

export default function FotoUploader({ fotos, onChange }) {
  const list = (fotos || "").split(",").filter(Boolean);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const confirm = useConfirm();

  async function subir(file) {
    if (!file) return;
    if (list.length >= MAX) {
      toast.error(`Máximo ${MAX} fotos`);
      return;
    }
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
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/mecanicos/perfil/fotos", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(r.data.fotosReferencia || "");
      toast.success("Foto subida");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  async function borrar(url) {
    const ok = await confirm({
      title: "¿Eliminar esta foto?",
      message: "La foto se borrará permanentemente del taller. Esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tipo: "danger",
    });
    if (!ok) return;
    try {
      const r = await api.delete("/mecanicos/perfil/fotos", {
        params: { url },
      });
      onChange(r.data.fotosReferencia || "");
      toast.success("Foto eliminada");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al borrar");
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) subir(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FaImages className="text-primary" />
          Fotos de referencia ({list.length}/{MAX})
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => list.length < MAX && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-6 text-center ${
          dragOver
            ? "border-primary bg-primary-softer scale-[1.01]"
            : "border-slate-300 bg-slate-50 hover:border-primary hover:bg-primary-softer/50"
        } ${list.length >= MAX ? "opacity-50 cursor-not-allowed" : ""}`}
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
        <FaCloudUploadAlt
          className={`mx-auto text-4xl mb-2 ${
            uploading ? "animate-bounce text-primary" : "text-primary/70"
          }`}
        />
        <p className="text-sm font-medium text-slate-700">
          {uploading
            ? "Subiendo..."
            : list.length >= MAX
            ? "Máximo de fotos alcanzado"
            : "Arrastra una imagen o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          JPG, PNG, WEBP, GIF, AVIF, BMP, TIFF, HEIC o ICO · máx 10 MB
        </p>
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
          {list.map((url) => (
            <div
              key={url}
              className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-soft aspect-[4/3] bg-slate-100"
            >
              <img
                src={url}
                alt="referencia"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  borrar(url);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                title="Eliminar"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
