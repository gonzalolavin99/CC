import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import Cargando from "./Cargando.jsx";

// Envuelve rutas que requieren sesión iniciada (ej: /checkout).
// Si no hay sesión, manda a crear cuenta y de vuelta a la misma ruta.
export default function RutaPrivada({ children }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ modo: "registro", redirect: location.pathname }}
        replace
      />
    );
  }

  return children;
}
