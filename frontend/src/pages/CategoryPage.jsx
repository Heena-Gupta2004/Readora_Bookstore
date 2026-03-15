import { useEffect, useState } from "react";
import { api, formatINR } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useParams } from "react-router-dom";

const slugToCategory = {
  hindi: "Hindi",
  kids: "Kids",
  romance: "Romance",
  "non-fiction": "Non Fiction",
  business: "Business",
};

const OFFLINE_HINT = "Backend is offline. Start backend: npm run dev:backend";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const category = slugToCategory[categorySlug] || "All";
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cartCounts, setCartCounts] = useState({});
  const [busyId, setBusyId] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api(`/books?category=${encodeURIComponent(category)}`)
      .then((data) => {
        setBooks(data.items || []);
        setError("");
      })
      .catch((err) => {
        const hint = err?.status >= 500 ? ` ${OFFLINE_HINT}` : "";
        setError((err.message || "Unable to load category books") + hint);
      });
  }, [category]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCartCounts({});
      return;
    }
    api("/cart")
      .then((data) => {
        const next = {};
        (data.items || []).forEach((item) => {
          next[item.id] = item.qty;
        });
        setCartCounts(next);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const heading = category === "All" ? "Books" : `${category} Books`;

  async function addTo(target, book) {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    try {
      setBusyId(book.id);
      await api(`/${target}`, { method: "POST", body: { book } });
      setMessage(target === "cart" ? "Added to cart" : "Added to wishlist");
      setTimeout(() => setMessage(""), 1500);
      if (target === "cart") {
        setCartCounts((prev) => ({ ...prev, [book.id]: (prev[book.id] || 0) + 1 }));
      }
    } catch (err) {
      const hint = err?.status >= 500 ? ` ${OFFLINE_HINT}` : "";
      setError((err.message || "Action failed") + hint);
    } finally {
      setBusyId("");
    }
  }

  async function updateQty(bookId, action) {
    setBusyId(bookId);
    try {
      await api(`/cart/${bookId}`, { method: "PATCH", body: { action } });
      setCartCounts((prev) => {
        const nextQty = Math.max(0, (prev[bookId] || 0) + (action === "inc" ? 1 : -1));
        if (nextQty === 0) {
          const { [bookId]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [bookId]: nextQty };
      });
    } catch (err) {
      const hint = err?.status >= 500 ? ` ${OFFLINE_HINT}` : "";
      setError((err.message || "Action failed") + hint);
    } finally {
      setBusyId("");
    }
  }

  return (
    <section>
      <div className="page-head">
        <h1>{heading}</h1>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </div>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!books.length && !error ? <p className="empty">No books found in this category.</p> : null}

      <div className="grid">
        {books.map((book) => (
          <article key={book.id} className="card">
            <img src={book.image} alt={book.title} />
            <h3>{book.title}</h3>
            <p>{book.category}</p>
            <strong>{formatINR(book.price)}</strong>
            <div className="actions">
              {cartCounts[book.id] ? (
                <>
                  <button type="button" onClick={() => updateQty(book.id, "dec")} disabled={busyId === book.id}>
                    -
                  </button>
                  <span className="badge">{cartCounts[book.id]}</span>
                  <button type="button" onClick={() => updateQty(book.id, "inc")} disabled={busyId === book.id}>
                    +
                  </button>
                </>
              ) : (
                <button onClick={() => addTo("cart", book)} type="button" disabled={busyId === book.id}>
                  Add to Cart
                </button>
              )}
              <button onClick={() => addTo("wishlist", book)} type="button" className="ghost">
                Wishlist
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
