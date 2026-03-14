import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUsername, clearUsername } from '../utils/userSession.js';
import { logoutUser } from '../utils/auth.js';

export default function Layout() {
  const username = useUsername();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {}
    clearUsername();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          Bracket Builder Free<sup>&reg;</sup>
        </div>

        <nav className="site-nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Home
          </NavLink>
          <NavLink to="/create" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Create a Bracket
          </NavLink>
          <NavLink to="/list" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            See Existing Brackets
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            About
          </NavLink>
        </nav>

        <div className="header-userBox">
          <span className="header-user">
            Username: {username ? username : 'Guest'}
          </span>
          {username ? (
            <button type="button" className="header-logout" onClick={handleLogout}>
              Logout
            </button>
          ) : null}
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span className="text-reset">Author: Jackson Passey</span>
        <br />
        <a className="text-reset" href="https://github.com/jxnpass/startup" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
