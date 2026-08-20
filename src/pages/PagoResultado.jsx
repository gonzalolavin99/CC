import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { consultarEstadoPedido } from "../lib/pagos.js";
import Cargando from "../components/Cargando.jsx";

// El webhook de confirmación de ePayco puede tardar unos segundos en llegar,
// así que reintentamos unas cuantas veces antes de asumir que sigue pendiente.
const INTENTOS = 8;
const ESPERA_MS = 2500;

export default function PagoResultado() {
  const [params] = useSearchParams();
  const pedidoId = params.get("pedido");
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pedidoId) return;

    let activo = true;
    async function consultar(intento) {
      try {
        const data = await consultarEstadoPedido(pedidoId);
        if (!activo) return;
        setPedido(data);
        if (data.estado === "pendiente" && intento < INTENTOS) {
          setTimeout(() => consultar(intento + 1), ESPERA_MS);
        }
      } catch (err) {
        if (activo) setError(err.message || "No se pudo consultar el pedido.");
      }
    }
    consultar(0);

    return () => {
      activo = false;
    };
  }, [pedidoId]);

  if (!pedidoId || error) {
    return (
      <section className="juegos">
        <div className="contenedor auth">
          <div className="auth-card" style={{ textAlign: "center" }}>
            <XCircle size={40} color="#ff5c8a" />
            <h2>Algo salió mal</h2>
            <p className="auth-subtitulo">
              {error || "No encontramos referencia de tu pedido."}
            </p>
            <Link to="/carrito" className="auth-boton">Volver al carrito</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!pedido) return <Cargando texto="Confirmando tu pago…" />;

  const config = {
    pagado: {
      icono: <CheckCircle2 size={40} color="#3ddc84" />,
      titulo: "¡Pago exitoso!",
      texto: "Tu pedido fue confirmado. Puedes ver el detalle en tu perfil.",
    },
    rechazado: {
      icono: <XCircle size={40} color="#ff5c8a" />,
      titulo: "El pago fue rechazado",
      texto: "No se realizó ningún cobro. Puedes intentar de nuevo desde el carrito.",
    },
    pendiente: {
      icono: <Clock size={40} color="#f5a623" />,
      titulo: "Estamos confirmando tu pago",
      texto: "Esto puede tardar unos minutos. Revisa el estado más tarde en tu perfil.",
    },
  }[pedido.estado] ?? {
    icono: <Clock size={40} />,
    titulo: "Procesando…",
    texto: "",
  };

  return (
    <section className="juegos">
      <div className="contenedor auth">
        <div className="auth-card" style={{ textAlign: "center" }}>
          {config.icono}
          <h2>{config.titulo}</h2>
          <p className="auth-subtitulo">{config.texto}</p>
          <p className="carrito-total" style={{ justifyContent: "center", display: "flex", gap: 8 }}>
            Total: <strong>${Number(pedido.total).toLocaleString("es-CO")} COP</strong>
          </p>
          <Link to="/perfil" className="auth-boton">Ver mis pedidos</Link>
        </div>
      </div>
    </section>
  );
}
