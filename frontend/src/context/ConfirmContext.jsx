import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  FaExclamationTriangle,
  FaSignOutAlt,
  FaTrash,
  FaQuestionCircle,
  FaCarCrash,
  FaWrench,
} from "react-icons/fa";

const ConfirmCtx = createContext(null);

const ICONOS = {
  warning: { Icon: FaExclamationTriangle, color: "warning", from: "from-amber-400", to: "to-amber-600" },
  danger: { Icon: FaTrash, color: "danger", from: "from-red-500", to: "to-red-700" },
  logout: { Icon: FaSignOutAlt, color: "primary", from: "from-primary", to: "to-primary-dark" },
  question: { Icon: FaQuestionCircle, color: "primary", from: "from-primary", to: "to-primary-dark" },
  cancel: { Icon: FaCarCrash, color: "danger", from: "from-red-500", to: "to-red-700" },
  wrench: { Icon: FaWrench, color: "primary", from: "from-primary", to: "to-primary-dark" },
};

export function ConfirmProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setOpts({
        title: options.title || "¿Confirmar acción?",
        message: options.message || "¿Estás seguro de continuar?",
        confirmText: options.confirmText || "Sí, continuar",
        cancelText: options.cancelText || "Cancelar",
        tipo: options.tipo || "question",
        // colorBoton se infiere de tipo si no se pasa
        colorBoton: options.colorBoton,
      });
    });
  }, []);

  const close = (result) => {
    setOpts(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {opts && <ConfirmDialog opts={opts} onConfirm={() => close(true)} onCancel={() => close(false)} />}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de ConfirmProvider");
  return ctx;
}

function ConfirmDialog({ opts, onConfirm, onCancel }) {
  const { Icon, from, to } = ICONOS[opts.tipo] || ICONOS.question;
  const btnClase =
    opts.colorBoton === "danger"
      ? "btn-danger"
      : opts.colorBoton === "warning"
      ? "btn-accent"
      : opts.colorBoton === "success"
      ? "btn-success"
      : opts.tipo === "danger" || opts.tipo === "cancel"
      ? "btn-danger"
      : opts.tipo === "warning"
      ? "btn-accent"
      : "btn-primary";

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden animate-scale-in p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera con icono mecánico animado */}
        <div className="relative bg-gradient-to-br from-primary-dark to-primary text-white p-6 pb-8 overflow-hidden">
          <GearsBackground />
          <div className="relative flex items-center gap-4">
            <div
              className={`shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${from} ${to} text-white flex items-center justify-center text-2xl shadow-2xl ring-4 ring-white/20 animate-shake-x`}
            >
              <Icon />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-extrabold leading-tight">
                {opts.title}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6 pt-5">
          <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
            {opts.message}
          </p>
          <div className="flex gap-2 mt-5 flex-col sm:flex-row-reverse">
            <button onClick={onConfirm} className={`${btnClase} flex-1`}>
              {opts.confirmText}
            </button>
            <button onClick={onCancel} className="btn-outline flex-1 sm:flex-none">
              {opts.cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GearsBackground() {
  return (
    <>
      <svg
        className="absolute -top-6 -right-6 w-24 h-24 text-white/10 animate-spin-medium"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
      </svg>
      <svg
        className="absolute -bottom-8 -left-8 w-28 h-28 text-white/10 animate-spin-medium-reverse"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
      </svg>
    </>
  );
}
