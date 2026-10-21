"use client";

import { useState } from 'react';

const inputStyle = (hasError = false) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
});

const labelStyle = {
  display: 'block',
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.8rem',
  fontWeight: 500,
  marginBottom: '0.4rem',
  letterSpacing: '0.02em',
};

const buttonStyle = (loading) => ({
  width: '100%',
  padding: '0.85rem',
  borderRadius: '10px',
  background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none',
  color: '#fff',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'opacity 0.2s',
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'We could not send a reset code. Please try again.');
        return;
      }

      setEmail(email.trim().toLowerCase());
      setMessage(data.message);
      setStep(2);
    } catch {
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'We could not reset your password. Please try again.');
        return;
      }

      setMessage(data.message);
      setPassword('');
      setConfirmPassword('');
      setStep(3);
    } catch {
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '1rem',
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px)',
  };

  const focusInput = (event) => {
    event.target.style.borderColor = 'rgba(99,102,241,0.6)';
  };

  const blurInput = (event) => {
    event.target.style.borderColor = 'rgba(255,255,255,0.1)';
  };

  return (
    <div className="auth-page" style={pageStyle}>
      <div className="auth-card" style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="auth-logo" style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '1.5rem',
          }}>
            🔐
          </div>
          <h1 className="auth-title" style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
            Reset your password
          </h1>
          <p className="auth-subtitle" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            {step === 1 ? 'We’ll email you a 6-digit reset code' : 'Choose a new password for your account'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendCode} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label htmlFor="email" style={labelStyle}>EMAIL</label>
              <input
                id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com" required autoComplete="email" className="auth-input"
                style={inputStyle(Boolean(error))} onFocus={focusInput} onBlur={blurInput}
              />
            </div>
            {error && <ErrorMessage message={error} />}
            <button type="submit" disabled={loading} className="auth-button" style={buttonStyle(loading)}>
              {loading ? 'Sending code…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '8px', padding: '0.65rem 1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem',
            }}>
              {message} Check <strong style={{ color: '#a5b4fc' }}>{email}</strong> for the code. It expires in 10 minutes.
            </div>
            <div>
              <label htmlFor="otp" style={labelStyle}>ONE-TIME PASSWORD</label>
              <input
                id="otp" type="text" inputMode="numeric" value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" required maxLength={6} autoComplete="one-time-code" className="auth-input"
                style={{ ...inputStyle(Boolean(error)), textAlign: 'center', fontSize: '1.6rem', letterSpacing: '0.4em', fontWeight: 700 }}
                onFocus={focusInput} onBlur={blurInput}
              />
            </div>
            <div>
              <label htmlFor="password" style={labelStyle}>NEW PASSWORD</label>
              <input
                id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" className="auth-input"
                style={inputStyle(Boolean(error))} onFocus={focusInput} onBlur={blurInput}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" style={labelStyle}>CONFIRM NEW PASSWORD</label>
              <input
                id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your new password" required minLength={8} autoComplete="new-password" className="auth-input"
                style={inputStyle(Boolean(error))} onFocus={focusInput} onBlur={blurInput}
              />
              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: '#fca5a5', fontSize: '0.75rem', margin: '0.35rem 0 0' }}>Passwords don&apos;t match</p>
              )}
            </div>
            {error && <ErrorMessage message={error} />}
            <button type="submit" disabled={loading} className="auth-button" style={buttonStyle(loading)}>
              {loading ? 'Resetting password…' : 'Reset password'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setMessage(''); setOtp(''); setPassword(''); setConfirmPassword(''); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              Use a different email address
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px',
              padding: '0.8rem 1rem', color: '#bbf7d0', fontSize: '0.9rem', marginBottom: '1.25rem',
            }}>
              {message}
            </div>
            <a href="/login" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>Go to sign in</a>
          </div>
        )}

        {step !== 3 && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
            Remembered your password? <a href="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>Sign in</a>
          </p>
        )}
      </div>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
      padding: '0.65rem 1rem', color: '#fca5a5', fontSize: '0.85rem',
    }}>
      {message}
    </div>
  );
}
