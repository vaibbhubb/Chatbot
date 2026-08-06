"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Helper: format timestamp ────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const tierInfo = {
  label: 'Personal',
  color: '#c4b5fd',
  bg: 'rgba(139, 92, 246, 0.12)',
  border: 'rgba(139, 92, 246, 0.35)',
};

export default function ChatUI({ username }) {
  const router = useRouter();

  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hey! I'm Vaibhav's AI clone. What's up?", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Audio — browser SpeechSynthesis (free, no API needed)
  const [autoPlay, setAutoPlay] = useState(false); // global TTS toggle
  const [playingIdx, setPlayingIdx] = useState(null);
  const synthRef = useRef(null);

  // Pick the best available English voice on mount
  const voiceRef = useRef(null);
  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer a natural-sounding English voice
      voiceRef.current =
        voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find(v => v.lang.startsWith('en-IN')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0] ||
        null;
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);


  // Voice recording
  const [recording, setRecording]         = useState(false);
  const [transcribing, setTranscribing]   = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const recordingTimerRef = useRef(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Scroll
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Browser SpeechSynthesis ───────────────────────────────────────
  const speakText = useCallback((text, msgIdx) => {
    if (!window.speechSynthesis) return;

    // Stop anything currently playing
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) utter.voice = voiceRef.current;
    utter.rate = 1.05;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    synthRef.current = utter;
    setPlayingIdx(msgIdx);

    utter.onend = () => setPlayingIdx(null);
    utter.onerror = () => setPlayingIdx(null);

    window.speechSynthesis.speak(utter);
  }, []);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setPlayingIdx(null);
  };

  // ── Send text message ─────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    if (!text?.trim() || loading) return;

    const userMsg = { role: 'user', content: text, time: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const errorReply = data.error || 'I had trouble replying just now. Try again in a moment.';
        setMessages([...updated, { role: 'ai', content: errorReply, time: new Date() }]);
        return;
      }

      if (data.reply) {
        const aiMsg = { role: 'ai', content: data.reply, time: new Date() };
        const withAi = [...updated, aiMsg];
        setMessages(withAi);

        // Auto-play if toggle is on
        if (autoPlay) {
          speakText(data.reply, withAi.length - 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, autoPlay, speakText]);


  const handleSubmit = (e) => { e.preventDefault(); handleSend(input); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  const handlePlayMessage = (msg, idx) => {
    if (playingIdx === idx) {
      stopSpeaking();
    } else {
      speakText(msg.content, idx);
    }
  };


  // ── Voice recording ───────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(blob);
      };

      mr.start();
      setRecording(true);
      setRecordSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone access in your browser.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordSeconds(0);
  };

  const transcribeAudio = async (blob) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64, mimeType: 'audio/webm' }),
        });
        const data = await res.json();
        if (data.text) {
          setInput(data.text); // Show in input for review
        }
        setTranscribing(false);
      };
    } catch {
      setTranscribing(false);
    }
  };

  const handleMicClick = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  // ── Logout ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#09090f',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#e2e8f0',
      overflow: 'hidden',
    }}>
      {/* Ambient background blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.85rem 1.5rem',
        background: 'rgba(255,255,255,0.025)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        flexShrink: 0,
      }}>
        {/* Left: AI info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', boxShadow: '0 0 20px rgba(99,102,241,0.3)',
          }}>💬</div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              AI Vaibhav
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Always online</span>
            </div>
          </div>
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Tier badge */}
          <div style={{
            padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
            color: tierInfo.color, background: tierInfo.bg, border: `1px solid ${tierInfo.border}`,
          }}>
            {tierInfo.label}
          </div>

          {/* Username */}
          <div style={{
            padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            @{username}
          </div>

          {/* Audio toggle */}
          <button
            id="audio-toggle"
            onClick={() => setAutoPlay(p => !p)}
            title={autoPlay ? 'Auto-play ON — click to mute' : 'Auto-play OFF — click to enable'}
            style={{
              width: '34px', height: '34px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: autoPlay ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              border: autoPlay ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
              fontSize: '1rem', transition: 'all 0.2s',
            }}
          >
            {autoPlay ? '🔊' : '🔇'}
          </button>

          {/* Logout */}
          <button
            id="logout-btn"
            onClick={handleLogout}
            style={{
              padding: '0.35rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '0.78rem',
              fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.18)'}
            onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.08)'}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ── MESSAGES ── */}
      <main style={{
        flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1,
        padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
      }}>
        <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: '0.5rem',
              animation: 'msgIn 0.25s ease',
            }}>
              {/* Avatar */}
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'ai'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'linear-gradient(135deg, #334155, #475569)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                boxShadow: msg.role === 'ai' ? '0 0 10px rgba(99,102,241,0.3)' : 'none',
              }}>
                {msg.role === 'ai' ? 'V' : (username?.[0]?.toUpperCase() || 'U')}
              </div>

              {/* Bubble + controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%', gap: '0.3rem' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                    : 'rgba(255,255,255,0.05)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
                  color: '#f1f5f9',
                  fontSize: '0.88rem', lineHeight: 1.6,
                  boxShadow: msg.role === 'user' ? '0 4px 20px rgba(79,70,229,0.3)' : 'none',
                }}>
                  {msg.content}
                </div>

                {/* Bottom meta: timestamp + play button for AI messages */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
                    {formatTime(new Date(msg.time))}
                  </span>
                  {msg.role === 'ai' && (
                    <button
                      onClick={() => handlePlayMessage(msg, idx)}
                      title={playingIdx === idx ? 'Pause' : 'Play voice'}
                      style={{
                        background: playingIdx === idx ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: '0.65rem',
                        color: playingIdx === idx ? '#818cf8' : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {playingIdx === `loading-${idx}` ? '⏳' : playingIdx === idx ? '⏸' : '▶'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', animation: 'msgIn 0.2s ease' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                boxShadow: '0 0 10px rgba(99,102,241,0.3)',
              }}>V</div>
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '18px 18px 18px 4px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', gap: '5px', alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'rgba(99,102,241,0.6)',
                    animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── INPUT BAR ── */}
      <footer style={{
        position: 'relative', zIndex: 10,
        padding: '1rem 1.5rem 1.25rem',
        background: 'rgba(9,9,15,0.85)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        flexShrink: 0,
      }}>
        {/* Transcribing indicator */}
        {transcribing && (
          <div style={{
            maxWidth: '720px', margin: '0 auto 0.6rem',
            fontSize: '0.75rem', color: '#818cf8',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'pulse 1s infinite' }} />
            Transcribing your voice…
          </div>
        )}

        {/* Recording indicator */}
        {recording && (
          <div style={{
            maxWidth: '720px', margin: '0 auto 0.6rem',
            fontSize: '0.75rem', color: '#f87171',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 0.8s infinite' }} />
            Recording… {recordSeconds}s — click mic again to stop
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          maxWidth: '720px', margin: '0 auto',
          display: 'flex', gap: '0.6rem', alignItems: 'center',
        }}>
          {/* Mic button */}
          <button
            type="button"
            id="mic-btn"
            onClick={handleMicClick}
            disabled={transcribing || loading}
            title={recording ? 'Stop recording' : 'Record voice message'}
            style={{
              width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
              border: recording ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
              background: recording ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
              cursor: (transcribing || loading) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', transition: 'all 0.2s',
              boxShadow: recording ? '0 0 16px rgba(239,68,68,0.3)' : 'none',
            }}
          >
            {recording ? '⏹' : transcribing ? '⏳' : '🎤'}
          </button>

          {/* Text input */}
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={recording ? 'Recording…' : transcribing ? 'Transcribing…' : 'Type a message…'}
            disabled={loading || recording}
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: '14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f1f5f9', fontSize: '0.88rem', outline: 'none',
              transition: 'border-color 0.2s', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.45)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />

          {/* Send button */}
          <button
            type="submit"
            id="send-btn"
            disabled={loading || !input.trim() || recording}
            style={{
              height: '46px', padding: '0 1.4rem', borderRadius: '14px', flexShrink: 0,
              border: 'none',
              background: (loading || !input.trim() || recording)
                ? 'rgba(99,102,241,0.25)'
                : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', fontSize: '0.88rem', fontWeight: 600,
              cursor: (loading || !input.trim() || recording) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
              boxShadow: (!loading && input.trim()) ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!loading && input.trim()) e.target.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.target.style.opacity = '1'; }}
          >
            {loading ? '…' : 'Send'}
          </button>
        </form>

        {/* Hint text */}
        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.18)', marginTop: '0.6rem', marginBottom: 0 }}>
          🎤 Voice note → text preview → send &nbsp;|&nbsp; 🔇 Audio off by default — click ▶ on any message or 🔊 for auto-play
        </p>
      </footer>

      {/* ── Animations ── */}
      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        * { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.2) transparent; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
