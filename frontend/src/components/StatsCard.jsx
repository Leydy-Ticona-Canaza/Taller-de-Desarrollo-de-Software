import useTilt from "../hooks/useTilt";

export default function StatsCard({ icon, label, value, color = "primary" }) {
  const colors = {
    primary: "from-cyan-400/30 to-cyan-400/10 text-cyan-300 border-cyan-300/40",
    accent: "from-accent/30 to-accent/10 text-accent-light border-accent/40",
    success: "from-emerald-400/30 to-emerald-400/10 text-emerald-300 border-emerald-300/40",
    warning: "from-amber-400/30 to-amber-400/10 text-amber-300 border-amber-300/40",
    danger: "from-red-400/30 to-red-400/10 text-red-300 border-red-300/40",
  };
  const tilt = useTilt({ max: 5 });

  return (
    <div
      ref={tilt.ref}
      {...tilt.handlers}
      className="glass-v2-soft tilt-3d relative overflow-hidden p-4 flex items-center gap-4"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br ${colors[color]} border shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          {label}
        </p>
        <p className="text-2xl font-extrabold text-white">{value}</p>
      </div>
    </div>
  );
}
