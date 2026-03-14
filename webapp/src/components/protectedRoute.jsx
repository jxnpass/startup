import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth.js';
import { setUsername, clearUsername } from '../utils/userSession.js';

export default function ProtectedRoute() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let ignore = false;

    async function checkAuth() {
      try {
        const data = await getCurrentUser();
        if (ignore) return;
        setUsername(data.user.username || '');
        setStatus('ok');
      } catch {
        if (ignore) return;
        clearUsername();
        setStatus('blocked');
      }
    }

    checkAuth();
    return () => {
      ignore = true;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
        <h2>Checking login…</h2>
      </div>
    );
  }

  if (status === 'blocked') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
