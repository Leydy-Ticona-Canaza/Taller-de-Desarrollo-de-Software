import { useRef, useCallback } from "react";

/**
 * Hook de "tilt 3D" con specular highlight.
 *
 * Devuelve un ref y handlers que aplican al hover/mouse move:
 *  - rotación X/Y del elemento (CSS transform 3D)
 *  - CSS variables --mx y --my con la posición relativa del cursor (0..100%)
 *    para que un pseudo-element pueda dibujar un brillo que sigue al mouse.
 *
 * Uso:
 *   const tilt = useTilt({ max: 8 });
 *   <div ref={tilt.ref} {...tilt.handlers} className="tilt-3d glass-v2">...</div>
 */
export default function useTilt({ max = 8, scale = 1.015, spring = true } = {}) {
  const ref = useRef(null);
  const raf = useRef(0);

  const apply = useCallback((rx, ry, mx, my) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
    el.style.setProperty("--tilt-scale", String(scale));
  }, [scale]);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0..1
    const py = (e.clientY - rect.top) / rect.height;   // 0..1
    // Rotación: el cursor en la esquina superior izquierda
    // gira la tarjeta hacia su esquina opuesta (efecto "papel inclinado")
    const ry = (px - 0.5) * (max * 2);   // izquierda/derecha
    const rx = -(py - 0.5) * (max * 2);  // arriba/abajo

    if (spring) {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => apply(rx, ry, px * 100, py * 100));
    } else {
      apply(rx, ry, px * 100, py * 100);
    }
  }, [max, spring, apply]);

  const onMouseLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tilt-scale", "1");
    // mantenemos --mx/--my en último valor para que el highlight no salte
  }, []);

  return {
    ref,
    handlers: { onMouseMove, onMouseLeave },
  };
}
