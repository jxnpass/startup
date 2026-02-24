import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useUsername } from '../utils/userSession.js';

export default function Layout() {
  const username = useUsername();

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

        <span className="header-user">
          Username: {username ? username : 'Guest'}
        </span>
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
