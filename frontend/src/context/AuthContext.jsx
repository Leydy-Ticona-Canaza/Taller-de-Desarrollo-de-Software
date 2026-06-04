import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, registerRequest, perfilRequest } from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    perfilRequest()
      .then((data) => setUsuario(data))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token, usuario } = await loginRequest({ email, password });
    localStorage.setItem("token", token);
    setUsuario(usuario);
    return usuario;
  }

  async function register(payload) {
    const { token, usuario } = await registerRequest(payload);
    localStorage.setItem("token", token);
    setUsuario(usuario);
    return usuario;
  }

  function logout() {
    localStorage.removeItem("token");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, setUsuario, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
