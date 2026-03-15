import React from "react";
import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const trailRef = useRef(null);

  useEffect(() => {
    const trail = trailRef.current;
    if (!trail) return;

    const colors = ["#ffd166", "#ff8fab", "#cdb4db", "#fff3b0"];
    let lastMove = 0;

    function spawnParticle(x, y) {
      const particle = document.createElement("div");
      particle.className = "magic-particle";
      particle.textContent = "\u2605";
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.fontSize = `${Math.random() * 10 + 10}px`;
      particle.style.setProperty("--x", `${(Math.random() - 0.5) * 50}px`);
      particle.style.setProperty("--y", `${(Math.random() - 0.5) * 50}px`);
      trail.appendChild(particle);
      setTimeout(() => particle.remove(), 900);
    }

    function onMove(event) {
      const now = Date.now();
      if (now - lastMove < 28) return;
      lastMove = now;
      spawnParticle(event.clientX, event.clientY);
      if (Math.random() > 0.45) {
        spawnParticle(event.clientX + (Math.random() - 0.5) * 12, event.clientY + (Math.random() - 0.5) * 12);
      }
    }

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-logo" aria-hidden="true">
            R
          </span>
          Readora
        </Link>

        <nav className="nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/wishlist">Wishlist</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          {!isAuthenticated ? (
            <NavLink to="/auth">Login</NavLink>
          ) : (
            <button className="link-btn" onClick={logout} type="button">
              Logout
            </button>
          )}
        </nav>
      </header>

      <main className="container">
        <Outlet />
      </main>
      <div className="magic-trail" ref={trailRef} />
    </div>
  );
}
