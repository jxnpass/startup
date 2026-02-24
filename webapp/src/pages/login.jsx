import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { setUsername } from "../utils/userSession.js";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function normalizeUsername(value) {
    const trimmed = (value || "").trim();
    if (!trimmed) return "";
    // If it's an email, use the part before @ for display
    if (trimmed.includes("@")) return trimmed.split("@")[0];
    return trimmed;
  }

  return (
    <div className="page page-login">
      <div className="login-card">
        <h1 className="login-title">
          Welcome to Bracket Builder Free<sup>&reg;</sup>
        </h1>

        <h3 className="login-subtitle">
          Create and manage your tournament brackets with ease!
        </h3>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();

            const username = normalizeUsername(email);
            setUsername(username);

            navigate("/list");
          }}
        >
          <div className="login-inputRow">
            <span aria-hidden="true">@</span>
            <input
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-inputRow">
            <span aria-hidden="true">🔒</span>
            <input
              type="password"
              placeholder="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="login-actions">
            <button type="submit">Login</button>
            <button type="button" onClick={() => navigate("/create")}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
