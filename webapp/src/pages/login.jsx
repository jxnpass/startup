import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUsername } from '../utils/userSession.js';
import { loginUser, registerUser, getProtectedMessage } from '../utils/auth.js';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth(mode) {
    setLoading(true);
    setMessage('');

    try {
      const action = mode === 'register' ? registerUser : loginUser;
      const data = await action(email, password);
      setUsername(data.user.username || '');

      const restricted = await getProtectedMessage();
      setMessage(restricted.message);
      navigate('/list');
    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
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
            handleAuth('login');
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
              required
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
              minLength={6}
              required
            />
          </div>

          <div className="login-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Working...' : 'Login'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAuth('register')}
            >
              {loading ? 'Working...' : 'Sign Up'}
            </button>
          </div>

          {message ? <p className="login-message">{message}</p> : null}
        </form>
      </div>
    </div>
  );
}
