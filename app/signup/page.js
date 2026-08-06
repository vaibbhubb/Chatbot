"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function SignupPage() {
  const router = useRouter();

  // Step 1 fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = details, 2 = verify OTP

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(2);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP + Create account
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit OTP.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, otp }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-logged in — redirect to chat
        router.push('/chat');
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
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

  return (
    <div className="auth-page" style={pageStyle}>
      <div className="auth-card" style={cardStyle}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="auth-logo" style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem',
          }}>
            ✨
          </div>
          <h1 className="auth-title" style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
            Create account
          </h1>
          <p className="auth-subtitle" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Join and chat with AI Vaibhav
          </p>
        </div>

        {/* Step indicator */}
        <div className="auth-stepper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2].map((s) => (
            <div key={s} className="auth-step-item" style={{ display: 'flex', alignItems: 'center', flex: s < 2 ? '1' : 'none', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: step >= s ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: step >= s ? '#fff' : 'rgba(255,255,255,0.3)',
                flexShrink: 0,
                transition: 'background 0.3s',
              }}>
                {step > s ? '✓' : s}
              </div>
              <span className="auth-step-label" style={{
                fontSize: '0.78rem',
                color: step >= s ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                whiteSpace: 'nowrap',
              }}>
                {s === 1 ? 'Your details' : 'Verify email'}
              </span>
              {s < 2 && (
                <div className="auth-step-line" style={{
                  flex: 1,
                  height: '1px',
                  background: step > s ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s',
                  marginLeft: '0.25rem',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: Username + Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={labelStyle}>USERNAME</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. vaibhav123"
                required
                autoComplete="username"
                className="auth-input"
                style={inputStyle()}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                Only letters, numbers, and underscores
              </p>
            </div>

            <div>
              <label style={labelStyle}>EMAIL</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="auth-input"
                style={inputStyle()}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              id="send-otp-btn"
              disabled={loading}
              className="auth-button"
              style={{
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
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.88'; }}
              onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
            >
              {loading ? 'Sending code…' : 'Send Verification Code →'}
            </button>
          </form>
        )}

        {/* STEP 2: Password + OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '8px',
              padding: '0.65rem 1rem',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.82rem',
            }}>
              📧 We&apos;ve sent a 6-digit code to <strong style={{ color: '#a5b4fc' }}>{email}</strong>
            </div>

            <div>
              <label style={labelStyle}>VERIFICATION CODE</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="auth-input"
                style={{
                  ...inputStyle(),
                  textAlign: 'center',
                  fontSize: '1.6rem',
                  letterSpacing: '0.4em',
                  fontWeight: 700,
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label style={labelStyle}>CREATE PASSWORD</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                className="auth-input"
                style={inputStyle(error && error.includes('password'))}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
                className="auth-input"
                style={inputStyle(error && error.includes('match'))}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                  Passwords don&apos;t match
                </p>
              )}
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              id="create-account-btn"
              disabled={loading}
              className="auth-button"
              style={{
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
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.88'; }}
              onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
            >
              {loading ? 'Creating account…' : 'Create Account & Enter Chat'}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setError(''); setOtp(''); setPassword(''); setConfirmPassword(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              ← Go back and change details
            </button>
          </form>
        )}

        {/* Login link */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}