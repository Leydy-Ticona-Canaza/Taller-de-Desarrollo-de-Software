import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaMapMarkedAlt,
  FaUserCog,
  FaImages,
  FaClock,
  FaWrench,
  FaStore,
  FaTruck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSave,
  FaCalendarAlt,
} from "react-icons/fa";
import api from "../../api/axios";
import { actualizarPerfilMecanico } from "../../api/mecanicos.api";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import MapPicker from "../../components/MapPicker.jsx";
import FotoUploader from "../../components/FotoUploader.jsx";
import AvatarUploader from "../../components/AvatarUploader.jsx";
import useTilt from "../../hooks/useTilt";
import { useAuth } from "../../context/AuthContext.jsx";

export default function PerfilMecanicoPage() {
  const qc = useQueryClient();
  const { usuario, setUsuario } = useAuth();
  const tiltHero = useTilt({ max: 4 });
  const { data: perfil, isLoading } = useQuery({
    queryKey: ["perfil-mecanico"],
    queryFn: async () => (await api.get("/auth/perfil")).data,
  });

  function handleAvatarChange(actualizado) {
    qc.invalidateQueries({ queryKey: ["perfil-mecanico"] });
    if (usuario) setUsuario({ ...usuario, ...actualizado });
  }

  const [form, setForm] = useState({
    nombreLocal: "",
    especialidades: "",
    descripcion: "",
    experiencia: "",
    ubicacion: "",
    esMovil: false,
    horarioInicio: "08:00",
    horarioFin: "18:00",
    diasDisponibles: "Lun,Mar,Mie,Jue,Vie",
    latitud: null,
    longitud: null,
    fotosReferencia: "",
  });

  useEffect(() => {
    if (perfil?.mecanico) {
      const m = perfil.mecanico;
      setForm({
        nombreLocal: m.nombreLocal || "",
        especialidades: m.especialidades || "",
        descripcion: m.descripcion || "",
        experiencia: m.experiencia || "",
        ubicacion: m.ubicacion || "",
        esMovil: !!m.esMovil,
        horarioInicio: m.horarioInicio || "08:00",
        horarioFin: m.horarioFin || "18:00",
        diasDisponibles: m.diasDisponibles || "Lun,Mar,Mie,Jue,Vie",
        latitud: m.latitud ?? null,
        longitud: m.longitud ?? null,
        fotosReferencia: m.fotosReferencia || "",
      });
    }
  }, [perfil]);

  const mut = useMutation({
    mutationFn: actualizarPerfilMecanico,
    onSuccess: () => {
      toast.success("Perfil actualizado");
      qc.invalidateQueries({ queryKey: ["perfil-mecanico"] });
    },
    onError: (e) =>
      toast.error(
        e.response?.data?.detail || e.response?.data?.message || "Error",
      ),
  });

  function handleSubmit(e) {
    e.preventDefault();
    const { fotosReferencia, ...rest } = form;
    mut.mutate(rest);
  }

  function setMapPos(lat, lng) {
    setForm((f) => ({ ...f, latitud: lat, longitud: lng }));
  }

  if (isLoading) return <LoadingSpinner />;
  if (!perfil?.mecanico)
    return (
      <div className="bg-cliente-glass min-h-full text-white">
        <span className="mesh-orb o1" aria-hidden />
        <div className="relative max-w-2xl mx-auto px-4 py-8">
          <div className="glass-v2 text-center text-white/70 p-6">
            Perfil de mecánico no encontrado.
          </div>
        </div>
      </div>
    );

  const aprobado = perfil.mecanico.aprobado;

  return (
    <div className="bg-cliente-glass min-h-full text-white">
      <span className="mesh-orb o1" aria-hidden />
      <span className="mesh-orb o2" aria-hidden />
      <span className="mesh-orb o3" aria-hidden />

      <div className="relative max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-5 animate-fade-in-up">
        {/* HERO del perfil mecánico */}
        <section
          ref={tiltHero.ref}
          {...tiltHero.handlers}
          className="glass-v2 glass-v2-iridescent tilt-3d relative overflow-hidden p-6 sm:p-8"
        >
          <svg
            aria-hidden
            className="absolute inset-0 w-full h-full opacity-[0.10] pointer-events-none"
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="pmline" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#5be1ff" />
                <stop offset="1" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <path d="M0,150 C200,80 400,180 600,90 L800,140 L800,200 L0,200 Z" fill="url(#pmline)" />
          </svg>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
            {/* Avatar clickeable */}
            <div className="shrink-0 sm:self-center">
              <AvatarUploader
                fotoUrl={perfil?.fotoPerfil || usuario?.fotoPerfil}
                nombre={perfil?.nombre || usuario?.nombre || "M"}
                onChange={handleAvatarChange}
                size={112}
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="chip-premium">
                <FaUserCog /> Perfil profesional
              </span>
              <h1 className="cliente-headline text-white drop-shadow mt-3">
                Mi <span className="text-gradient-accent">taller</span>
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {aprobado ? (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur">
                    <FaCheckCircle className="mr-1" /> Cuenta verificada
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 backdrop-blur">
                    <FaExclamationTriangle className="mr-1" /> Pendiente de aprobación
                  </span>
                )}
                <span className="text-xs text-white/65">
                  Configura tus datos, ubicación y fotos para atraer clientes.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Aviso si no aprobado */}
        {!aprobado && (
          <div className="glass-v2 p-5 flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
              <FaExclamationTriangle />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-amber-300">
                Tu perfil está en revisión
              </p>
              <p className="text-sm text-white/75 mt-1">
                Aparecerás en las búsquedas una vez que el administrador apruebe
                tu cuenta. Mientras tanto, completa toda tu información.
              </p>
            </div>
          </div>
        )}

        {/* Datos profesionales */}
        <form onSubmit={handleSubmit} className="glass-v2 p-5 sm:p-7 space-y-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <FaWrench className="text-accent-light" /> Datos profesionales
          </h2>

          <div>
            <label className="label-dark inline-flex items-center gap-2">
              <FaStore className="text-accent-light" /> Nombre del local / taller
            </label>
            <input
              className="input-dark"
              placeholder="Taller Don Juan"
              value={form.nombreLocal}
              onChange={(e) =>
                setForm({ ...form, nombreLocal: e.target.value })
              }
            />
          </div>

          <div>
            <label className="label-dark inline-flex items-center gap-2">
              <FaWrench className="text-accent-light" /> Especialidades
            </label>
            <input
              className="input-dark"
              placeholder="Frenos, Motor, Eléctrico..."
              value={form.especialidades}
              onChange={(e) =>
                setForm({ ...form, especialidades: e.target.value })
              }
            />
            <p className="text-xs text-white/55 mt-1">Sepáralas con comas</p>
          </div>

          <div>
            <label className="label-dark">Descripción</label>
            <textarea
              rows={3}
              className="input-dark"
              placeholder="Cuéntales a tus clientes qué te diferencia..."
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-dark">Experiencia</label>
              <input
                className="input-dark"
                placeholder="ej. 5 años"
                value={form.experiencia}
                onChange={(e) =>
                  setForm({ ...form, experiencia: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label-dark">Dirección / Ubicación</label>
              <input
                className="input-dark"
                placeholder="Av. Principal #123, Ciudad"
                value={form.ubicacion}
                onChange={(e) =>
                  setForm({ ...form, ubicacion: e.target.value })
                }
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={form.esMovil}
              onChange={(e) => setForm({ ...form, esMovil: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
            <FaTruck className="text-accent-light" />
            <span className="text-sm text-white/85 font-semibold">
              Ofrezco servicio a domicilio
            </span>
          </label>

          {/* Disponibilidad */}
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 pb-2 border-b border-white/10 pt-4">
            <FaClock className="text-accent-light" /> Disponibilidad
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-dark">Horario inicio</label>
              <input
                type="time"
                className="input-dark"
                value={form.horarioInicio}
                onChange={(e) =>
                  setForm({ ...form, horarioInicio: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label-dark">Horario fin</label>
              <input
                type="time"
                className="input-dark"
                value={form.horarioFin}
                onChange={(e) =>
                  setForm({ ...form, horarioFin: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="label-dark inline-flex items-center gap-2">
              <FaCalendarAlt className="text-accent-light" /> Días disponibles
            </label>
            <input
              className="input-dark"
              value={form.diasDisponibles}
              onChange={(e) =>
                setForm({ ...form, diasDisponibles: e.target.value })
              }
            />
            <p className="text-xs text-white/55 mt-1">
              Ej: Lun,Mar,Mie,Jue,Vie,Sab
            </p>
          </div>

          {/* Ubicación con mapa */}
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 pb-2 border-b border-white/10 pt-4">
            <FaMapMarkedAlt className="text-accent-light" /> Ubicación del taller
          </h2>
          <p className="text-sm text-white/65">
            Busca tu dirección, haz clic en el mapa o arrastra el marcador para
            que tus clientes te encuentren fácilmente.
          </p>
          <div className="rounded-2xl overflow-hidden border border-white/15">
            <MapPicker
              lat={form.latitud}
              lng={form.longitud}
              onChange={setMapPos}
            />
          </div>

          <button
            className="btn-accent w-full mt-2 shine-on-hover text-base py-3"
            disabled={mut.isPending}
          >
            <FaSave /> {mut.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        {/* Fotos */}
        <div className="glass-v2 p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
            <FaImages className="text-accent-light" /> Fotos de referencia
          </h2>
          <p className="text-sm text-white/65 mb-3">
            Sube fotos que ayuden a tus clientes a encontrar tu taller: fachada,
            entrada, calles cercanas, puntos de referencia, etc.
          </p>
          <FotoUploader
            fotos={form.fotosReferencia}
            onChange={(fotos) => {
              setForm((f) => ({ ...f, fotosReferencia: fotos }));
              qc.invalidateQueries({ queryKey: ["perfil-mecanico"] });
            }}
          />
        </div>
      </div>
    </div>
  );
}
