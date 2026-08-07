"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/dashboard/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.refresh();
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b1120 0%, #111827 50%, #0b1120 100%)',
      color: '#e2e8f0',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.45)',
        padding: '2rem',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
            Private dashboard
          </div>
          <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.6rem', color: '#fff' }}>Chat query viewer</h1>
          <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
            Sign in with the test account to see user queries.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>USERNAME</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="test"
              autoComplete="username"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="test"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              borderRadius: '12px',
              padding: '0.8rem 1rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            {loading ? 'Signing in…' : 'Enter dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}