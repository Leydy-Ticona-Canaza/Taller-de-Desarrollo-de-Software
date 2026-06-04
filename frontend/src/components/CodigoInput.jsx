import { useRef } from "react";

export default function CodigoInput({ value, onChange, length = 6, disabled }) {
  const refs = useRef([]);
  const digits = (value || "").padEnd(length, " ").slice(0, length).split("");

  function setDigit(i, ch) {
    const limpio = ch.replace(/\D/g, "").slice(0, 1);
    const arr = digits.map((d) => (d === " " ? "" : d));
    arr[i] = limpio;
    const nuevo = arr.join("").trimEnd();
    onChange(nuevo);
    if (limpio && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function onKeyDown(e, i) {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onPaste(e) {
    const data = e.clipboardData?.getData("text") || "";
    const limpio = data.replace(/\D/g, "").slice(0, length);
    if (limpio) {
      e.preventDefault();
      onChange(limpio);
      const next = Math.min(limpio.length, length - 1);
      setTimeout(() => refs.current[next]?.focus(), 0);
    }
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i].trim()}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
          onFocus={(e) => e.target.select()}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-2xl font-extrabold border-2 border-slate-300 rounded-xl bg-white text-primary-dark focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all disabled:opacity-50"
        />
      ))}
    </div>
  );
}
