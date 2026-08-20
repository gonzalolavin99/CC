import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ShoppingCart } from "lucide-react";
import { useCart } from "../lib/CartContext.jsx";
import { crearSesionPago } from "../lib/pagos.js";
import Cargando from "../components/Cargando.jsx";

// TODO Fase 4: pasar a false y usar las llaves de producción cuando el
// backend esté desplegado y la cuenta de ePayco esté validada.
const EPAYCO_TEST_MODE = true;

export default function Checkout() {
  const { items, cargando, subtotal } = useCart();
  const navigate = useNavigate();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  if (cargando) return <Cargando texto="Cargando tu pedido…" />;

  if (items.length === 0) {
    return (
      <section className="juegos">
        <div className="contenedor carrito-vacio">
          <ShoppingCart size={40} />
          <p>Tu carrito está vacío.</p>
        </div>
      </section>
    );
  }

  async function pagar() {
    setError("");
    if (typeof window.ePayco === "undefined") {
      setError("No se pudo cargar la pasarela de pago. Recarga la página e intenta de nuevo.");
      return;
    }
    setProcesando(true);
    try {
      const { sessionId, pedidoId } = await crearSesionPago();

      const checkout = window.ePayco.checkout.configure({
        sessionId,
        type: "onpage",
        test: EPAYCO_TEST_MODE,
      });

      checkout.setHooks({
        onResponse: () => {
          navigate(`/pago/resultado?pedido=${pedidoId}`);
        },
        onErrors: (err) => {
          console.error("Error en el pago:", err);
          setError("Hubo un error al procesar el pago. Intenta de nuevo.");
          setProcesando(false);
        },
        onClosed: () => {
          setProcesando(false);
        },
      });

      checkout.open();
    } catch (err) {
      console.error("Error creando la sesión de pago:", err);
      setError(err.message || "No se pudo iniciar el pago. Intenta de nuevo.");
      setProcesando(false);
    }
  }

  return (
    <section className="juegos">
      <div className="contenedor carrito-pagina">
        <h2>Confirmar y pagar</h2>

        <div className="carrito-grid">
          <div className="carrito-lista">
            {items.map((i) => (
              <div className="carrito-item" key={`${i.tipo}-${i.item_id}`}>
                <div className="carrito-item-img">
                  {i.imagen ? (
                    <img src={i.imagen} alt={i.nombre} />
                  ) : (
                    <span className="carrito-sin-img" />
                  )}
                </div>
                <div className="carrito-item-info">
                  <span className="carrito-item-nombre">{i.nombre}</span>
                  <span className="carrito-item-tipo">
                    {i.tipo === "carta" ? "Carta" : "Accesorio"} · {i.cantidad} unidad(es)
                  </span>
                </div>
                <p className="carrito-linea">
                  ${(i.precio * i.cantidad).toLocaleString("es-CO")}
                </p>
              </div>
            ))}
          </div>

          <aside className="carrito-resumen">
            <h3>Resumen</h3>
            <p className="carrito-resumen-fila carrito-total">
              <span>Total</span>
              <strong>${subtotal.toLocaleString("es-CO")} COP</strong>
            </p>
            <button
              type="button"
              className="carrito-pagar"
              onClick={pagar}
              disabled={procesando}
            >
              <CreditCard size={16} />
              {procesando ? "Procesando…" : "Pagar con ePayco"}
            </button>
            {error && <p className="auth-mensaje auth-error">{error}</p>}
          </aside>
        </div>
      </div>
    </section>
  );
}
