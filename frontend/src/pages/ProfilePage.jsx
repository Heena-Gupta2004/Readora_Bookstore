import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatINR } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    Promise.all([api("/cart"), api("/wishlist"), api("/orders")])
      .then(([cartData, wishlistData, ordersData]) => {
        const count = (cartData.items || []).reduce((sum, item) => sum + item.qty, 0);
        setCartCount(count);
        setWishlistCount((wishlistData.items || []).length);
        setOrders(ordersData.items || []);
        setError("");
      })
      .catch((err) => setError(err.message || "Unable to load profile stats"))
      .finally(() => setLoadingOrders(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <section className="panel">
        <h1>Profile</h1>
        <p>Please login to view your profile.</p>
        <Link to="/auth">Go to Login</Link>
      </section>
    );
  }

  return (
    <section className="profile-grid">
      <div className="panel profile-main">
        <div className="avatar">{(user?.name || "U").charAt(0).toUpperCase()}</div>
        <h1>{user?.name}</h1>
        <p>{user?.email}</p>
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          <Link to="/cart"><button type="button">Go to Cart</button></Link>
          <Link to="/wishlist"><button type="button" className="ghost">Go to Wishlist</button></Link>
        </div>
      </div>

      <aside className="panel">
        <h2>Activity</h2>
        <div className="row"><span>Cart Items</span><strong>{cartCount}</strong></div>
        <div className="row"><span>Wishlist Items</span><strong>{wishlistCount}</strong></div>
      </aside>

      <section className="panel">
        <h2>Order History</h2>
        {loadingOrders ? <p className="empty">Loading orders...</p> : null}
        {!loadingOrders && !orders.length ? <p className="empty">No orders yet.</p> : null}
        {orders.map((order) => (
          <article key={order._id} className="line-item">
            <div className="order-info">
              <h3>Order Placed</h3>
              <p>{new Date(order.createdAt).toLocaleString()}</p>
              <p>{order.items?.length || 0} items</p>
              <strong>{formatINR(order.total)}</strong>
              <p className="order-status">Status: {order.status}</p>
            </div>
            <div className="order-items">
              {(order.items || []).map((item) => (
                <div key={item.id} className="order-item">
                  <img src={item.image} alt={item.title} />
                  <div>
                    <p className="order-title">{item.title}</p>
                    <p className="order-meta">{item.qty} x {formatINR(item.price)}</p>
                    <strong className="order-total">{formatINR(item.price * item.qty)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
