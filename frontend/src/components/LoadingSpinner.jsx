export default function LoadingSpinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <div className="relative w-14 h-14 mb-3">
        <div className="absolute inset-0 border-4 border-primary-light/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-transparent border-b-accent border-l-accent rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.4s" }} />
      </div>
      <span className="text-sm font-medium tracking-wide animate-pulse">{text}</span>
    </div>
  );
}
