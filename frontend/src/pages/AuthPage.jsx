import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page panel">
      <h1>{mode === "register" ? "Create account" : "Login"}</h1>
      <form onSubmit={onSubmit} className="form">
        {mode === "register" ? (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        ) : null}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "register" ? "Register" : "Login"}</button>
      </form>

      <button type="button" className="ghost" onClick={() => setMode(mode === "login" ? "register" : "login") }>
        {mode === "login" ? "New user? Create account" : "Already have account? Login"}
      </button>
    </section>
  );
}
