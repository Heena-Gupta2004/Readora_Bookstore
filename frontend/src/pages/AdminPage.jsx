import { useEffect, useState } from "react";
import { api, formatINR } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    api("/admin/orders")
      .then((data) => {
        setOrders(data.items || []);
        setError("");
      })
      .catch((err) => setError(err.message || "Unable to load orders"));
  }, [isAuthenticated, isAdmin]);

  async function updateStatus(orderId, status) {
    setBusyId(orderId);
    try {
      const data = await api(`/admin/orders/${orderId}/status`, { method: "PATCH", body: { status } });
      setOrders((prev) => prev.map((order) => (order._id === orderId ? data.order : order)));
    } catch (err) {
      setError(err.message || "Unable to update status");
    } finally {
      setBusyId("");
    }
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <section className="panel">
        <h1>Admin</h1>
        <p>Access denied.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>Admin Orders</h1>
      {error ? <p className="error">{error}</p> : null}
      {!orders.length ? <p className="empty">No orders yet.</p> : null}
      <div className="order-admin-list">
        {orders.map((order) => (
          <article key={order._id} className="order-admin-card">
            <div>
              <h3>Order</h3>
              <p>{new Date(order.createdAt).toLocaleString()}</p>
              <p>{order.user?.email || "Unknown user"}</p>
              <strong>{formatINR(order.total)}</strong>
            </div>
            <div className="order-admin-items">
              {(order.items || []).map((item) => (
                <div key={item.id} className="order-item">
                  <img src={item.image} alt={item.title} />
                  <div>
                    <p className="order-title">{item.title}</p>
                    <p className="order-meta">{item.qty} x {formatINR(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-admin-actions">
              <label>
                Status
                <select
                  value={order.status}
                  onChange={(event) => updateStatus(order._id, event.target.value)}
                  disabled={busyId === order._id}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
