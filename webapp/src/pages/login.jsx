import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1>
        Welcome to Bracket Builder Free<sup>&reg;</sup>
      </h1>
      <h3 id="fun">Create and manage your tournament brackets with ease!</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate('/list');
        }}
      >
        <div>
          <span>@</span>
          <input type="email" placeholder="your@email.com" />
        </div>
        <div>
          <span role="img" aria-label="lock">
            🔒
          </span>
          <input type="password" placeholder="password" />
        </div>

        <button type="submit">Login</button>
        <button type="button" onClick={() => navigate('/create')}>
          Create
        </button>
      </form>
    </div>
  );
}
