import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaBriefcase,
  FaTruck,
  FaClock,
  FaImages,
  FaMapMarkedAlt,
  FaWrench,
  FaCommentDots,
  FaCheckCircle,
  FaArrowLeft,
  FaCarCrash,
  FaPaperPlane,
  FaStar,
  FaSignInAlt,
  FaUserPlus,
  FaLock,
  FaPlusCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { detalleMecanico } from "../../api/mecanicos.api";
import { crearResena, eliminarResena } from "../../api/resenas.api";
import StarRating, { StarPicker } from "../../components/StarRating.jsx";
import ServicioCard from "../../components/ServicioCard.jsx";
import ResenaCard from "../../components/ResenaCard.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import MapView from "../../components/MapView.jsx";
import FotosGallery from "../../components/FotosGallery.jsx";
import AgendarCitaWizard from "../../components/AgendarCitaWizard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";

export default function DetalleMecanicoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { usuario } = useAuth();
  const confirm = useConfirm();
  const [showWizard, setShowWizard] = useState(false);

  function abrirAgendar() {
    if (!usuario) {
      navigate("/login", { state: { from: `/mecanico/${id}` } });
      return;
    }
    setShowWizard(true);
  }

  const { data: mecanico, isLoading } = useQuery({
    queryKey: ["mecanico", id],
    queryFn: () => detalleMecanico(id),
  });

  const puedeEliminarResenas =
    usuario?.rol === "admin" || usuario?.rol === "soporte";
  const esCliente = usuario?.rol === "cliente";
  const esVisitante = !usuario;

  function reservarServicio(servicio) {
    if (esCliente) {
      navigate(`/reservar/${mecanico.id}/${servicio.id}`);
    } else {
      navigate("/login", {
        state: { from: `/reservar/${mecanico.id}/${servicio.id}` },
      });
    }
  }

  function irAEmergencia() {
    if (esCliente) {
      navigate("/emergencia");
    } else {
      navigate("/login", { state: { from: "/emergencia" } });
    }
  }

  const eliminarMut = useMutation({
    mutationFn: eliminarResena,
    onSuccess: () => {
      toast.success("Reseña eliminada");
      qc.invalidateQueries({ queryKey: ["mecanico", id] });
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Error al eliminar"),
  });

  async function pedirEliminar(resena) {
    const ok = await confirm({
      title: "¿Eliminar esta reseña?",
      message: `Vas a eliminar la reseña de ${resena.cliente?.nombre || "este usuario"}. Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      tipo: "danger",
    });
    if (ok) eliminarMut.mutate(resena.id);
  }

  if (isLoading) return <LoadingSpinner />;
  if (!mecanico) return null;

  const fotos = (mecanico.fotosReferencia || "").split(",").filter(Boolean);
  const fotoPrincipal = fotos[0];
  const tieneUbicacion =
    mecanico.latitud != null && mecanico.longitud != null;

  // Detectar si el cliente ya dejó una reseña "de perfil" a este mecánico
  const yaDejoResena =
    esCliente &&
    mecanico.resenas?.some(
      (r) => r.clienteId === usuario.id && r.citaId == null,
    );

  return (
    <div className="bg-cliente-glass min-h-full text-white animate-fade-in-up">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {fotoPrincipal && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{
              backgroundImage: `url(${fotoPrincipal})`,
              filter: "blur(8px) brightness(0.4) saturate(120%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/60 to-zinc-950/95" />

        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 pt-6 pb-14 sm:pb-20 text-white">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/75 hover:text-accent-light text-sm mb-4 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur transition-all"
          >
            <FaArrowLeft /> Volver
          </button>

          <div className="grid sm:grid-cols-[auto_1fr] gap-5 sm:gap-7 items-end">
            <div className="relative">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-accent/40 via-cyan-400/30 to-purple-400/30 blur-2xl" />
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 text-4xl sm:text-5xl font-extrabold flex items-center justify-center shadow-2xl ring-2 ring-white/50 overflow-hidden">
                {mecanico.usuario?.fotoPerfil ? (
                  <img
                    src={mecanico.usuario.fotoPerfil}
                    alt={mecanico.usuario?.nombre || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  mecanico.usuario?.nombre?.charAt(0)
                )}
              </div>
            </div>

            <div className="min-w-0">
              {mecanico.nombreLocal && (
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-accent-light mb-1">
                  {mecanico.nombreLocal}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {mecanico.aprobado && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur">
                    <FaCheckCircle className="mr-1" /> Verificado
                  </span>
                )}
                {mecanico.esMovil && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-accent/20 text-accent-light border border-accent/40 backdrop-blur">
                    <FaTruck className="mr-1" /> A domicilio
                  </span>
                )}
              </div>
              <h1 className="cliente-headline text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)] break-words">
                {mecanico.usuario?.nombre}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StarRating value={mecanico.calificacionPromedio || 0} />
                <span className="text-sm text-white/75">
                  {mecanico.totalTrabajos || 0} trabajos · {mecanico.resenas?.length || 0} reseñas
                </span>
              </div>
              {mecanico.descripcion && (
                <p className="mt-3 text-white/85 max-w-2xl leading-relaxed">
                  {mecanico.descripcion}
                </p>
              )}

              {/* CTA AGENDAR (visible para visitantes y clientes; visitantes son redirigidos al login) */}
              {(usuario?.rol === "cliente" || esVisitante) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={abrirAgendar}
                    className="relative group px-5 py-3 rounded-2xl font-extrabold text-zinc-950 bg-gradient-to-br from-accent to-accent-dark shadow-[0_14px_40px_-12px_rgba(245,158,11,0.7)] hover:shadow-[0_18px_50px_-12px_rgba(245,158,11,0.9)] hover:-translate-y-0.5 transition-all overflow-hidden inline-flex items-center gap-2.5 shine-on-hover"
                  >
                    <FaPlusCircle className="text-lg animate-pulse" />
                    Agendar cita aquí
                  </button>
                  {tieneUbicacion && (
                    <button
                      onClick={irAEmergencia}
                      className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-bold inline-flex items-center gap-2 backdrop-blur transition-all"
                    >
                      <FaMapMarkedAlt /> Cómo llegar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-10 sm:-mt-14 relative z-10 space-y-5 pb-10">
        {/* Tarjeta de contacto/info rápida */}
        <div className="glass-v2 p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mecanico.ubicacion && (
            <InfoItem
              icon={<FaMapMarkerAlt />}
              label="Ubicación"
              value={mecanico.ubicacion}
            />
          )}
          {(mecanico.horarioInicio || mecanico.horarioFin) && (
            <InfoItem
              icon={<FaClock />}
              label="Horario"
              value={`${mecanico.horarioInicio || ""} - ${mecanico.horarioFin || ""}`}
              sub={mecanico.diasDisponibles}
            />
          )}
          {mecanico.experiencia && (
            <InfoItem
              icon={<FaBriefcase />}
              label="Experiencia"
              value={mecanico.experiencia}
            />
          )}
          {mecanico.usuario?.telefono && (
            <InfoItem
              icon={<FaPhone />}
              label="Teléfono"
              value={mecanico.usuario.telefono}
              href={`tel:${mecanico.usuario.telefono}`}
            />
          )}
          {mecanico.usuario?.email && (
            <InfoItem
              icon={<FaEnvelope />}
              label="Email"
              value={mecanico.usuario.email}
              href={`mailto:${mecanico.usuario.email}`}
            />
          )}
        </div>

        {/* Especialidades */}
        {mecanico.especialidades && (
          <div className="glass-v2 p-5">
            <h2 className="text-xs font-bold text-white/55 uppercase tracking-[0.18em] mb-3">
              Especialidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {mecanico.especialidades.split(",").map((esp) => (
                <span
                  key={esp}
                  className="inline-flex items-center text-sm font-semibold py-1.5 px-3 rounded-full bg-white/8 border border-white/15 text-white/90 backdrop-blur hover:bg-accent/20 hover:border-accent/50 hover:text-accent-light transition-all cursor-default"
                >
                  {esp.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ubicación con mapa */}
        {tieneUbicacion && (
          <div className="glass-v2 p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <FaMapMarkedAlt className="text-accent-light" /> Cómo llegar al taller
              </h2>
              <button
                onClick={irAEmergencia}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-accent-light bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all inline-flex items-center gap-2"
                title={
                  esCliente
                    ? "Ver guía con flechas desde mi ubicación"
                    : "Inicia sesión para usar la guía SOS"
                }
              >
                <FaCarCrash /> Ruta paso a paso
              </button>
            </div>
            <div className="h-[280px] sm:h-[320px] rounded-2xl overflow-hidden">
              <MapView
                lat={mecanico.latitud}
                lng={mecanico.longitud}
                label={`${mecanico.usuario?.nombre || ""}${mecanico.ubicacion ? " — " + mecanico.ubicacion : ""}`}
                height="100%"
              />
            </div>
          </div>
        )}

        {/* Galería de fotos de referencia */}
        {fotos.length > 0 && (
          <div className="glass-v2 p-5">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-1">
              <FaImages className="text-accent-light" /> Fotos del taller
            </h2>
            <p className="text-sm text-white/65 mb-4">
              Mira cómo es el taller y identifícalo fácilmente al llegar.
            </p>
            <FotosGallery fotos={mecanico.fotosReferencia} />
          </div>
        )}

        {/* Servicios */}
        <div className="glass-v2 p-5">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-1">
            <FaWrench className="text-accent-light" /> Servicios disponibles
          </h2>
          <p className="text-sm text-white/65 mb-4">
            Elige un servicio y reserva tu cita directamente.
          </p>
          {mecanico.servicios?.length === 0 ? (
            <div className="text-white/60 text-center py-6">
              Este mecánico aún no tiene servicios publicados.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 stagger">
              {mecanico.servicios?.map((s) => (
                <ServicioCard
                  key={s.id}
                  servicio={s}
                  onReservar={reservarServicio}
                />
              ))}
            </div>
          )}
        </div>

        {/* Formulario para dejar reseña (solo cliente autenticado) */}
        {esCliente && !yaDejoResena && (
          <FormularioResena mecanicoId={mecanico.id} />
        )}
        {esCliente && yaDejoResena && (
          <div className="glass-v2 p-5 flex items-center gap-3 border-emerald-400/30">
            <FaCheckCircle className="text-emerald-400 text-xl shrink-0" />
            <p className="text-sm text-white/85">
              Ya dejaste una reseña en el perfil de este mecánico. ¡Gracias por tu opinión!
            </p>
          </div>
        )}
        {esVisitante && <CtaLoginParaResena />}

        {/* Reseñas */}
        <div className="glass-v2 p-5">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-1">
            <FaCommentDots className="text-accent-light" /> Reseñas de clientes (
            {mecanico.resenas?.length || 0})
          </h2>
          {mecanico.resenas?.length === 0 ? (
            <div className="text-white/60 text-center py-6">
              Aún no hay reseñas. ¡Sé el primero en dejar una!
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 mt-3 stagger">
              {mecanico.resenas.map((r) => (
                <ResenaCard
                  key={r.id}
                  resena={r}
                  onDelete={puedeEliminarResenas ? pedirEliminar : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showWizard && (
        <AgendarCitaWizard
          mecanicoInicial={mecanico}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

function FormularioResena({ mecanicoId }) {
  const qc = useQueryClient();
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");

  const mut = useMutation({
    mutationFn: crearResena,
    onSuccess: () => {
      toast.success("¡Gracias por tu reseña!");
      setCalificacion(0);
      setComentario("");
      qc.invalidateQueries({ queryKey: ["mecanico", String(mecanicoId)] });
    },
    onError: (e) =>
      toast.error(e.response?.data?.detail || "No se pudo enviar la reseña"),
  });

  function submit(e) {
    e.preventDefault();
    if (calificacion < 1) {
      return toast.error("Selecciona una calificación de estrellas");
    }
    mut.mutate({
      mecanicoId,
      calificacion,
      comentario: comentario.trim() || null,
    });
  }

  return (
    <form onSubmit={submit} className="glass-v2 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <FaStar className="text-accent-light text-xl" />
        <h2 className="text-xl font-extrabold text-white">
          Deja tu reseña
        </h2>
      </div>
      <p className="text-sm text-white/65">
        Comparte tu experiencia con este mecánico para ayudar a otros clientes.
      </p>
      <div>
        <label className="label-dark">Tu calificación</label>
        <StarPicker value={calificacion} onChange={setCalificacion} />
      </div>
      <div>
        <label className="label-dark">Comentario (opcional)</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="input-dark min-h-[90px]"
          maxLength={500}
          placeholder="Cuéntale a otros clientes cómo fue tu experiencia..."
        />
        <div className="text-xs text-white/45 text-right mt-1">
          {comentario.length}/500
        </div>
      </div>
      <button
        type="submit"
        className="btn-accent w-full sm:w-auto shine-on-hover"
        disabled={mut.isPending}
      >
        <FaPaperPlane /> {mut.isPending ? "Enviando..." : "Publicar reseña"}
      </button>
    </form>
  );
}

function CtaLoginParaResena() {
  return (
    <div className="glass-v2 p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-accent/15 text-accent-light border border-accent/30 flex items-center justify-center shrink-0">
          <FaLock />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white">
            ¿Te atendió este mecánico? Deja tu reseña
          </h3>
          <p className="text-sm text-white/65 mt-0.5">
            Inicia sesión o crea una cuenta gratis para calificar con estrellas
            y dejar un comentario que ayude a otros clientes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/login" className="btn-accent text-sm py-1.5 shine-on-hover">
              <FaSignInAlt /> Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white/85 bg-white/5 border border-white/15 hover:bg-white/10 backdrop-blur transition-all inline-flex items-center gap-2"
            >
              <FaUserPlus /> Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, sub, href }) {
  const inner = (
    <>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 text-accent-light border border-accent/40 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/55">
          {label}
        </div>
        <div className="font-semibold text-white truncate">{value}</div>
        {sub && <div className="text-xs text-white/55 truncate">{sub}</div>}
      </div>
    </>
  );
  const cn =
    "flex items-center gap-3 p-1 rounded-lg transition-colors" +
    (href ? " hover:bg-white/5" : "");
  return href ? (
    <a href={href} className={cn}>
      {inner}
    </a>
  ) : (
    <div className={cn}>{inner}</div>
  );
}
