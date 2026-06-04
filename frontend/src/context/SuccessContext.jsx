import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { FaCheck, FaWrench } from "react-icons/fa";

const SuccessCtx = createContext(null);

export function SuccessProvider({ children }) {
  const [state, setState] = useState(null);

  const success = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      const dur = opts.duration ?? 2400;
      setState({
        title: opts.title || "¡Éxito!",
        message: opts.message || "",
        emoji: opts.emoji,
        actionLabel: opts.actionLabel,
        // si action existe, no autocierra; el usuario cierra
        autoClose: !opts.actionLabel,
        duration: dur,
        _resolve: resolve,
      });
    });
  }, []);

  function close() {
    const s = state;
    setState(null);
    if (s?._resolve) s._resolve();
  }

  return (
    <SuccessCtx.Provider value={success}>
      {children}
      {state && <SuccessModal opts={state} onClose={close} />}
    </SuccessCtx.Provider>
  );
}

export function useSuccess() {
  const ctx = useContext(SuccessCtx);
  if (!ctx) throw new Error("useSuccess debe usarse dentro de SuccessProvider");
  return ctx;
}

function SuccessModal({ opts, onClose }) {
  useEffect(() => {
    if (!opts.autoClose) return;
    const t = setTimeout(onClose, opts.duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={opts.autoClose ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fondo animado con engranajes */}
        <div className="relative bg-gradient-to-br from-success via-green-600 to-primary-dark text-white p-6 sm:p-8 overflow-hidden">
          {/* Engranajes de fondo */}
          <GearSvg className="absolute -top-10 -left-10 w-32 h-32 text-white/15 animate-spin-medium" />
          <GearSvg className="absolute -bottom-12 -right-12 w-40 h-40 text-white/10 animate-spin-medium-reverse" />

          {/* Chispas */}
          <Sparks />

          {/* Centro: gran círculo con engranajes contrarrotando + checkmark / wrench */}
          <div className="relative flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
              <GearSvg className="absolute inset-0 w-full h-full text-white/30 animate-spin-medium" />
              <GearSvg
                className="absolute inset-3 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] text-white/40 animate-spin-medium-reverse"
                style={{ animationDuration: "2.5s" }}
              />
              <div className="absolute inset-6 sm:inset-7 rounded-full bg-white shadow-glow flex items-center justify-center">
                {opts.emoji ? (
                  <span className="text-4xl sm:text-5xl animate-bounce-in">
                    {opts.emoji}
                  </span>
                ) : (
                  <>
                    <FaCheck className="text-success text-3xl sm:text-4xl animate-check-pop" />
                  </>
                )}
              </div>
              {/* Llave inglesa flotando alrededor */}
              <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center shadow-lg animate-wrench-wiggle">
                <FaWrench className="text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7 text-center">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-primary-dark animate-fade-in-up">
            {opts.title}
          </h3>
          {opts.message && (
            <p
              className="mt-2 text-slate-600 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              {opts.message}
            </p>
          )}

          {opts.actionLabel ? (
            <button
              onClick={onClose}
              className="btn-primary w-full mt-5 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              {opts.actionLabel}
            </button>
          ) : (
            <div
              className="mt-4 text-xs text-slate-400 uppercase tracking-[0.2em] font-bold animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Cerrando en un momento...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GearSvg({ className, style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
    </svg>
  );
}

function Sparks() {
  // Chispas pequeñas que salen radialmente al abrir
  const chispas = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 80 + Math.random() * 50;
    return {
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      delay: Math.random() * 0.2,
      color: ["#FBBF24", "#F59E0B", "#FCD34D", "#FFFFFF"][i % 4],
    };
  });
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {chispas.map((c, i) => (
        <span
          key={i}
          className="block absolute w-2 h-2 rounded-full animate-spark"
          style={{
            backgroundColor: c.color,
            boxShadow: `0 0 8px ${c.color}`,
            "--tx": `${c.tx}px`,
            "--ty": `${c.ty}px`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
