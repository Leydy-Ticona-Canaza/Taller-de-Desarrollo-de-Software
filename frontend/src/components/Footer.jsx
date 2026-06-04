export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-zinc-950 via-black to-zinc-950 text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
        <div className="flex items-center gap-3">
          <img
            src="/logo_nuevo.png"
            alt="Juan El Mecánico"
            className="h-28 w-28 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.55)]"
          />
          <div>
            <div className="font-extrabold text-lg leading-tight">
              Juan <span className="text-accent">El Mecánico</span>
            </div>
            <div className="text-xs text-white/60 uppercase tracking-widest">
              Reservas online
            </div>
          </div>
        </div>

        <div className="text-sm text-white/80 sm:border-l sm:border-white/10 sm:pl-8">
          <p className="font-semibold text-white mb-1">Sobre nosotros</p>
          <p className="leading-relaxed">
            Plataforma de reserva de servicios mecánicos. Conectamos clientes
            con profesionales independientes verificados.
          </p>
        </div>

        <div className="text-sm text-white/80 sm:border-l sm:border-white/10 sm:pl-8">
          <p className="font-semibold text-white mb-1">Contacto</p>
          <p>soporte@juanelmecanico.com</p>
          <p className="text-white/60 mt-2 text-xs">
            ¿Eres mecánico? Únete a la red y empieza a recibir clientes.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
          <span>
            © {new Date().getFullYear()} Juan El Mecánico. Todos los derechos
            reservados.
          </span>
          <span>Hecho con motor y pasión.</span>
        </div>
      </div>
    </footer>
  );
}
