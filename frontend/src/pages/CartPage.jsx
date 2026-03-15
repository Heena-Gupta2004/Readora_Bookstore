import { useEffect, useMemo, useState } from "react";
import { api, formatINR } from "../lib/api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { isAuthenticated } = useAuth();

  async function loadCart() {
    try {
      const data = await api("/cart");
      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load cart");
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

  async function updateQty(id, action) {
    setBusy(true);
    try {
      await api(`/cart/${id}`, { method: "PATCH", body: { action } });
      await loadCart();
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id) {
    setBusy(true);
    try {
      await api(`/cart/${id}`, { method: "DELETE" });
      await loadCart();
    } finally {
      setBusy(false);
    }
  }

  async function clearCart() {
    setBusy(true);
    try {
      await api("/cart", { method: "DELETE" });
      await loadCart();
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      await api("/orders", { method: "POST" });
      setMessage("Order placed successfully.");
      await loadCart();
    } catch (err) {
      setError(err.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  if (!isAuthenticated) {
    return (
      <section className="panel">
        <h1>Cart</h1>
        <p>Please login to view your cart.</p>
        <Link to="/auth">Go to Login</Link>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="page-head">
        <h1>Shopping Cart</h1>
        <p>{count} items</p>
      </div>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="cart-layout">
        <div className="panel items-panel">
          <div className="panel-top">
            <h2>Items</h2>
            <button type="button" className="ghost" onClick={clearCart} disabled={!items.length || busy}>
              Clear Cart
            </button>
          </div>

          {!items.length ? <p className="empty">Your cart is empty.</p> : null}

          {items.map((item) => (
            <article className="line-item" key={item.id}>
              <img src={item.image} alt={item.title} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.category}</p>
                <strong>{formatINR(item.price)}</strong>
                <div className="qty-row">
                  <button type="button" onClick={() => updateQty(item.id, "dec")} disabled={busy}>
                    -
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => updateQty(item.id, "inc")} disabled={busy}>
                    +
                  </button>
                  <button type="button" className="ghost" onClick={() => removeItem(item.id)} disabled={busy}>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="panel summary summary-panel">
          <h2>Summary</h2>
          <div className="row"><span>Subtotal</span><strong>{formatINR(total)}</strong></div>
          <div className="row"><span>Delivery</span><strong>Free</strong></div>
          <div className="row total"><span>Total</span><strong>{formatINR(total)}</strong></div>
          <button type="button" disabled={!items.length || busy} onClick={checkout}>Checkout</button>
        </aside>
      </div>
    </section>
  );
}
