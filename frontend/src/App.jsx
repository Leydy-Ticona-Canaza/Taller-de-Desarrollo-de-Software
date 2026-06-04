import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import PasswordResetPage from "./pages/auth/PasswordResetPage.jsx";

import HomePage from "./pages/cliente/HomePage.jsx";
import DetalleMecanicoPage from "./pages/cliente/DetalleMecanicoPage.jsx";
import ReservarCitaPage from "./pages/cliente/ReservarCitaPage.jsx";
import MisCitasPage from "./pages/cliente/MisCitasPage.jsx";
import PerfilPage from "./pages/cliente/PerfilPage.jsx";
import EmergenciaPage from "./pages/cliente/EmergenciaPage.jsx";

import DashboardPage from "./pages/mecanico/DashboardPage.jsx";
import MisServiciosPage from "./pages/mecanico/MisServiciosPage.jsx";
import GestionCitasPage from "./pages/mecanico/GestionCitasPage.jsx";
import PerfilMecanicoPage from "./pages/mecanico/PerfilMecanicoPage.jsx";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import GestionUsuariosPage from "./pages/admin/GestionUsuariosPage.jsx";
import AprobacionMecanicosPage from "./pages/admin/AprobacionMecanicosPage.jsx";

import SoporteDashboardPage from "./pages/soporte/SoporteDashboardPage.jsx";
import SoporteUsuariosPage from "./pages/soporte/SoporteUsuariosPage.jsx";
import SoporteMecanicosPage from "./pages/soporte/SoporteMecanicosPage.jsx";
import SoporteResenasPage from "./pages/soporte/SoporteResenasPage.jsx";

export default function App() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-primary-softer via-white to-primary-softer relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
        <img
          src="/logo_nuevo.png"
          alt="Juan El Mecánico"
          className="h-48 w-48 object-contain animate-float-slow drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
        />
        <div className="text-primary-dark font-semibold tracking-[0.2em] uppercase text-sm animate-pulse">
          Cargando...
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 relative pt-[7rem] bg-zinc-950">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar" element={<PasswordResetPage />} />

          {/* Públicas: cualquier visitante puede explorar mecánicos */}
          <Route path="/buscar" element={<HomePage />} />
          <Route path="/mecanico/:id" element={<DetalleMecanicoPage />} />

          <Route
            path="/emergencia"
            element={
              <ProtectedRoute roles={["cliente"]}>
                <EmergenciaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservar/:mecanicoId/:servicioId"
            element={
              <ProtectedRoute roles={["cliente"]}>
                <ReservarCitaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-citas"
            element={
              <ProtectedRoute roles={["cliente"]}>
                <MisCitasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute roles={["cliente", "mecanico", "admin", "soporte"]}>
                <PerfilPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mecanico/dashboard"
            element={
              <ProtectedRoute roles={["mecanico"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mecanico/servicios"
            element={
              <ProtectedRoute roles={["mecanico"]}>
                <MisServiciosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mecanico/citas"
            element={
              <ProtectedRoute roles={["mecanico"]}>
                <GestionCitasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mecanico/perfil"
            element={
              <ProtectedRoute roles={["mecanico"]}>
                <PerfilMecanicoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute roles={["admin"]}>
                <GestionUsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/mecanicos"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AprobacionMecanicosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/soporte"
            element={
              <ProtectedRoute roles={["soporte"]}>
                <SoporteDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/soporte/usuarios"
            element={
              <ProtectedRoute roles={["soporte"]}>
                <SoporteUsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/soporte/mecanicos"
            element={
              <ProtectedRoute roles={["soporte"]}>
                <SoporteMecanicosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/soporte/resenas"
            element={
              <ProtectedRoute roles={["soporte"]}>
                <SoporteResenasPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <div aria-hidden className="section-blend" />
      </main>
      <Footer />
    </div>
  );
}
