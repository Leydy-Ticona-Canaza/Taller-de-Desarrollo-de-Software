import { useEffect, useState } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function FotosGallery({ fotos }) {
  const list = (fotos || "").split(",").filter(Boolean);
  const [idx, setIdx] = useState(null);
  const open = idx !== null;

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setIdx(null);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % list.length);
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + list.length) % list.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, list.length]);

  if (list.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
        {list.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setIdx(i)}
            className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-soft aspect-[4/3] bg-slate-100 focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            <img
              src={url}
              alt={`Referencia ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIdx(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <FaTimes />
          </button>
          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx((i) => (i - 1 + list.length) % list.length);
                }}
                className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx((i) => (i + 1) % list.length);
                }}
                className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <FaChevronRight />
              </button>
            </>
          )}
          <img
            src={list[idx]}
            alt={`Referencia ${idx + 1}`}
            className="max-h-[85vh] max-w-[92vw] rounded-xl shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {idx + 1} / {list.length}
          </div>
        </div>
      )}
    </>
  );
}
