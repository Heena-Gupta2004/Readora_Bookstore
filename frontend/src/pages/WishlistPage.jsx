import React from "react";
import { useEffect, useState } from "react";
import { api, formatINR } from "../lib/api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  async function loadWishlist() {
    try {
      const data = await api("/wishlist");
      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load wishlist");
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    loadWishlist();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <section className="panel">
        <h1>Wishlist</h1>
        <p>Please login to view your wishlist.</p>
        <Link to="/auth">Go to Login</Link>
      </section>
    );
  }

  async function removeItem(id) {
    await api(`/wishlist/${id}`, { method: "DELETE" });
    await loadWishlist();
  }

  async function moveToCart(id) {
    await api(`/wishlist/${id}/move-to-cart`, { method: "POST" });
    await loadWishlist();
  }

  return (
    <section className="wishlist-page">
      <div className="page-head">
        <h1>Wishlist</h1>
        <p>{items.length} saved</p>
      </div>
      {error ? <p className="error">{error}</p> : null}

      <div className="panel items-panel">
        {!items.length ? <p className="empty">Your wishlist is empty.</p> : null}
        {items.map((item) => (
          <article className="line-item" key={item.id}>
            <img src={item.image} alt={item.title} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.category}</p>
              <strong>{formatINR(item.price)}</strong>
              <div className="qty-row">
                <button type="button" onClick={() => moveToCart(item.id)}>Move to Cart</button>
                <button type="button" className="ghost" onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
