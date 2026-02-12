import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login/login';
import { About } from './about/about';
import { Create } from './create/create';
import { List } from './list/list';
import { Bracket } from './bracket/bracket';
import { Nav } from 'react-bootstrap';


export default function App() {
  return (
    <BrowserRouter>
        <div className="body bg-dark text-light">
        <header className="container-fluid">
            <nav className="navbar fixed-top navbar-dark">
            <div className="navbar-brand">
                Bracket Builder Free<sup>&reg;</sup>
            </div>
            <menu className="navbar-nav">
                <li className="nav-item">
                <NavLink className="nav-link" to="/">
                    Home
                </NavLink>
                </li>
                <li className="nav-item">
                <NavLink className="nav-link" to="/create">
                    Create a Bracket
                </NavLink>
                </li>
                <li className="nav-item">
                <NavLink className="nav-link" to="/list">
                    See Existing Brackets
                </NavLink>
                </li>
                <li className="nav-item">
                <NavLink className="nav-link" to="/about">
                    About
                </NavLink>
                </li>
            </menu>
            </nav>
        </header>

        <footer className="bg-dark text-white-50">
            <div className="container-fluid">
            <span className="text-reset">Jackson Passey</span>
            <a className="text-reset" href="https://github.com/jxnpass/startup">
                Source
            </a>
            </div>
        </footer>
        </div>
    </BrowserRouter>
  );
}

