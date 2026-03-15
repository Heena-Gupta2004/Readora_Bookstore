import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import NotFoundPage from "./pages/NotFoundPage";
import CategoryPage from "./pages/CategoryPage";
import AdminPage from "./pages/AdminPage";

function LegacyHtmlRedirect() {
  const location = useLocation();
  const rawPath = location.pathname.startsWith("/") ? location.pathname.slice(1) : location.pathname;
  const decodedPath = decodeURIComponent(rawPath || "");

  const redirects = {
    "index.html": "/",
    "business.html": "/",
    "hindi.html": "/",
    "kids.html": "/",
    "romance.html": "/",
    "non fiction.html": "/",
    "cart.html": "/cart",
    "wishlist.html": "/wishlist",
    "profile.html": "/profile",
    "login.html": "/auth",
  };

  const to = redirects[decodedPath];
  if (to) {
    return <Navigate to={to} replace />;
  }
  return <NotFoundPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="categories/:categorySlug" element={<CategoryPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="login" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<LegacyHtmlRedirect />} />
      </Route>
    </Routes>
  );
}
