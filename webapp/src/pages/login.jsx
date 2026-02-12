import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="page page-login">
      <div className="login-card">
        <h1 className="login-title">
          Welcome to Bracket Builder Free<sup>&reg;</sup>
        </h1>

        <h3 className="login-subtitle">Create and manage your tournament brackets with ease!</h3>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/list");
          }}
        >
          <div className="login-inputRow">
            <span aria-hidden="true">@</span>
            <input type="email" placeholder="your@email.com" autoComplete="email" />
          </div>

          <div className="login-inputRow">
            <span aria-hidden="true">🔒</span>
            <input type="password" placeholder="password" autoComplete="current-password" />
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
