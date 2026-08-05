"use client";

import { useState } from 'react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Sending OTP...');

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('OTP sent successfully! Please check your inbox.');
        setOtpSent(true);
      } else {
        setMessage('Failed to send OTP: ' + data.error);
      }
    } catch (error) {
      setMessage('An error occurred while sending the OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Verifying and creating account...');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Account created successfully! You can now log in.');
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (error) {
      setMessage('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-center">Join the Chat</h1>
        <p className="text-gray-400 text-center mb-8">Create an account to talk to the AI.</p>
        
        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., coolfriend99" 
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" 
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white" 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white p-3 rounded-lg font-semibold transition-colors mt-2"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Create Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password" 
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Enter OTP</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code" 
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white tracking-widest text-center" 
                required 
                maxLength={6}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white p-3 rounded-lg font-semibold transition-colors mt-2"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>
        )}

        {message && (
          <p className="text-center text-sm mt-4 text-gray-300">{message}</p>
        )}
      </div>
    </div>
  );
}
<p className="text-center text-sm mt-6 text-gray-400">
          Already have an account? <a href="/login" className="text-blue-500 hover:underline">Log in here</a>
        </p>