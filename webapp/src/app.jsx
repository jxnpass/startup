import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/layout.jsx';
import Login from './pages/login.jsx';
import Create from './pages/create.jsx';
import List from './pages/list.jsx';
import About from './pages/about.jsx';
import Bracket from './pages/bracket.jsx';
import ProtectedRoute from './components/protectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Login />} />
        <Route path="/about" element={<About />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/create" element={<Create />} />
          <Route path="/list" element={<List />} />
          <Route path="/bracket/:id" element={<Bracket />} />
          <Route path="/bracket" element={<Navigate to="/list" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}