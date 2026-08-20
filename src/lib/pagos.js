import { supabase } from "./supabase.js";

const API_URL = import.meta.env.VITE_API_URL;

async function llamarBackend(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Error de red al hablar con el servidor");
  return body;
}

// Crea el pedido en el backend y la sesión de pago en ePayco.
export function crearSesionPago() {
  return llamarBackend("/api/pagos/crear-sesion", { method: "POST" });
}

// Consulta el estado actual de un pedido (pendiente | pagado | rechazado).
export function consultarEstadoPedido(pedidoId) {
  return llamarBackend(`/api/pagos/estado/${pedidoId}`);
}
