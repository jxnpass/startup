import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/layout.jsx';
import Login from './pages/login.jsx';
import Create from './pages/create.jsx';
import List from './pages/list.jsx';
import About from './pages/about.jsx';
import Bracket from './pages/bracket.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Login />} />
        <Route path="/create" element={<Create />} />
        <Route path="/list" element={<List />} />
        <Route path="/about" element={<About />} />
        <Route path="/bracket" element={<Bracket />} />

        {/* nice default */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
