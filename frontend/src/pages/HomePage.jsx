import { useEffect, useState } from "react";
import { api, formatINR } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const categoryLinks = [
  {
    label: "Hindi Books",
    slug: "hindi",
    image: "https://m.media-amazon.com/images/I/71Gn678zNFL._SY466_.jpg",
  },
  {
    label: "Kids Books",
    slug: "kids",
    image: "https://m.media-amazon.com/images/I/81HK9JFPNaL._SY466_.jpg",
  },
  {
    label: "Romance Books",
    slug: "romance",
    image: "https://m.media-amazon.com/images/I/51ejN5YB8pL._SY445_SX342_FMwebp_.jpg",
  },
  {
    label: "Non Fiction",
    slug: "non-fiction",
    image: "https://m.media-amazon.com/images/I/416dFscW04L._SY445_SX342_FMwebp_.jpg",
  },
  {
    label: "Business Books",
    slug: "business",
    image: "https://m.media-amazon.com/images/I/519KVBbmfCL._SY466_.jpg",
  },
];
const heroImages = [
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=1600&q=80",
];

const OFFLINE_HINT = "Backend is offline. Start backend: npm run dev:backend";

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [cartCounts, setCartCounts] = useState({});
  const [busyId, setBusyId] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api("/books")
      .then((data) => setBooks(data.items || []))
      .catch((err) => {
        const hint = err?.status >= 500 ? ` ${OFFLINE_HINT}` : "";
        setError((err.message || "Unable to load books") + hint);
      });
  }, []);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="hero hero-visual">
        <img className="hero-bg" src={heroImages[heroIndex]} alt="Books hero" />
        <div className="hero-overlay">
          <h1>Discover your next favorite book</h1>
          <p>Curated collections for every kind of reader.</p>
          <a className="hero-btn" href="#categories">
            Explore Categories
          </a>
        </div>
      </div>

      <section id="categories" className="category-section">
        <div className="page-head">
          <h1>Browse Categories</h1>
          <p>Select any category to open its subpage with category-wise books.</p>
        </div>

        <div className="category-image-grid">
          {categoryLinks.map((cat) => (
            <Link key={cat.slug} className="category-image-card" to={`/categories/${cat.slug}`}>
              <img src={cat.image} alt={cat.label} />
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {message ? <p className="notice">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="page-head">
        <h1>Featured Books</h1>
      </div>
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
