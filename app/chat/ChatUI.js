"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Helper: format timestamp ────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ChatUI({ username }) {
  const router = useRouter();

  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hey! I'm Vaibhav's AI clone. What's up?", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Audio — browser SpeechSynthesis (free, no API needed)
  const [autoPlay, setAutoPlay] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(null);
  const synthRef = useRef(null);

  // Pick the best available English voice on mount
  const voiceRef = useRef(null);
  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
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

  // Scroll to bottom
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Fix mobile viewport height (keyboard shrinks 100vh) ──────────
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  // ── Browser SpeechSynthesis ───────────────────────────────────────
  const speakText = useCallback((text, msgIdx) => {
    if (!window.speechSynthesis) return;
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
        if (autoPlay) speakText(data.reply, withAi.length - 1);
      }
    } catch (err) {
      console.error(err);
      setMessages([...updated, { role: 'ai', content: 'Connection error. Check your internet and try again.', time: new Date() }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, autoPlay, speakText]);

  const handleSubmit = (e) => { e.preventDefault(); handleSend(input); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  const handlePlayMessage = (msg, idx) => {
    if (playingIdx === idx) stopSpeaking();
    else speakText(msg.content, idx);
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
        if (data.text) setInput(data.text);
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
    <>
      <style>{`
        :root { --vh: 1vh; }

        .chat-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          height: calc(var(--vh, 1vh) * 100);
          background: #09090f;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #e2e8f0;
          overflow: hidden;
          position: fixed;
          inset: 0;
        }

        /* ── HEADER ── */
        .chat-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.7rem 1rem;
          background: rgba(15,15,25,0.97);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 20;
          gap: 0.5rem;
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          flex: 1;
        }

        .chat-avatar-lg {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          box-shadow: 0 0 16px rgba(99,102,241,0.35);
        }

        .chat-header-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f1f5f9;
          white-space: nowrap;
        }

        .chat-header-status {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 1px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px rgba(52,211,153,0.6);
          flex-shrink: 0;
        }

        .status-text {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.4);
        }

        .chat-header-right {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }

        .username-badge {
          padding: 0.22rem 0.55rem;
          border-radius: 20px;
          font-size: 0.68rem;
          color: rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          white-space: nowrap;
        }

        .icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .logout-btn {
          padding: 0.3rem 0.7rem;
          border-radius: 10px;
          border: 1px solid rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.08);
          color: #fca5a5;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          white-space: nowrap;
        }

        /* ── MESSAGES AREA ── */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .chat-list-inner {
          max-width: 680px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .msg-row {
          display: flex;
          align-items: flex-end;
          gap: 0.45rem;
          animation: msgIn 0.22s ease;
        }

        .msg-row.user { flex-direction: row-reverse; }

        .msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 700;
          color: #fff;
        }

        .msg-avatar.ai {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 0 10px rgba(99,102,241,0.3);
        }

        .msg-avatar.user-av {
          background: linear-gradient(135deg, #334155, #475569);
        }

        .msg-wrap {
          display: flex;
          flex-direction: column;
          max-width: min(75%, 460px);
          gap: 0.25rem;
        }

        .msg-wrap.user { align-items: flex-end; }
        .msg-wrap.ai   { align-items: flex-start; }

        .msg-bubble {
          padding: 0.65rem 0.9rem;
          font-size: 0.875rem;
          line-height: 1.55;
          color: #f1f5f9;
          word-break: break-word;
        }

        .msg-bubble.ai {
          border-radius: 18px 18px 18px 4px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .msg-bubble.user {
          border-radius: 18px 18px 4px 18px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          box-shadow: 0 4px 16px rgba(79,70,229,0.3);
        }

        .msg-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0 0.2rem;
        }

        .msg-time {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.22);
        }

        .play-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .play-btn.active {
          background: rgba(99,102,241,0.2);
          color: #818cf8;
        }

        /* ── TYPING INDICATOR ── */
        .typing-row {
          display: flex;
          align-items: flex-end;
          gap: 0.45rem;
          animation: msgIn 0.2s ease;
        }

        .typing-bubble {
          padding: 0.65rem 0.9rem;
          border-radius: 18px 18px 18px 4px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(99,102,241,0.7);
        }

        /* ── INPUT BAR ── */
        .chat-footer {
          flex-shrink: 0;
          background: rgba(9,9,15,0.97);
          border-top: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          padding: 0.65rem 0.75rem;
          padding-bottom: max(0.65rem, env(safe-area-inset-bottom));
          z-index: 20;
        }

        .status-bar {
          max-width: 680px;
          margin: 0 auto 0.4rem;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .status-bar.recording { color: #f87171; }
        .status-bar.transcribing { color: #818cf8; }

        .status-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .chat-compose {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .mic-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .mic-btn.idle {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
        }

        .mic-btn.active-rec {
          background: rgba(239,68,68,0.18);
          border: 1px solid rgba(239,68,68,0.5);
          box-shadow: 0 0 16px rgba(239,68,68,0.3);
        }

        .chat-input {
          flex: 1;
          min-width: 0;
          height: 44px;
          padding: 0 0.9rem;
          border-radius: 22px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          color: #f1f5f9;
          font-size: 0.875rem;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
          -webkit-appearance: none;
        }

        .chat-input:focus {
          border-color: rgba(99,102,241,0.5);
        }

        .send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex-shrink: 0;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn.ready {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
        }

        .send-btn.disabled {
          background: rgba(99,102,241,0.18);
          cursor: not-allowed;
        }

        /* ── Ambient blobs ── */
        .ambient {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        /* ── Animations ── */
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }

        /* ── Scrollbar ── */
        .chat-messages { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.2) transparent; }
        .chat-messages::-webkit-scrollbar { width: 3px; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 2px; }

        /* ── Mobile tweaks ── */
        @media (max-width: 480px) {
          .chat-header { padding: 0.6rem 0.75rem; }
          .chat-avatar-lg { width: 36px; height: 36px; font-size: 1rem; }
          .chat-header-name { font-size: 0.88rem; }
          .logout-btn { font-size: 0.7rem; padding: 0.25rem 0.55rem; }
          .username-badge { display: none; }
          .chat-messages { padding: 0.75rem 0.5rem; }
          .msg-bubble { font-size: 0.845rem; padding: 0.6rem 0.8rem; }
          .chat-footer { padding: 0.55rem 0.6rem; padding-bottom: max(0.55rem, env(safe-area-inset-bottom)); }
        }
      `}</style>

      <div className="chat-shell">
        {/* Ambient background */}
        <div className="ambient">
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        {/* ── HEADER (WhatsApp-style, always frozen at top) ── */}
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar-lg">💬</div>
            <div>
              <div className="chat-header-name">AI Vaibhav</div>
              <div className="chat-header-status">
                <div className="status-dot" />
                <span className="status-text">Always online</span>
              </div>
            </div>
          </div>

          <div className="chat-header-right">
            <span className="username-badge">@{username}</span>

            {/* Audio toggle */}
            <button
              id="audio-toggle"
              className="icon-btn"
              onClick={() => setAutoPlay(p => !p)}
              title={autoPlay ? 'Auto-play ON — click to mute' : 'Auto-play OFF'}
              style={{
                background: autoPlay ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: autoPlay ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {autoPlay ? '🔊' : '🔇'}
            </button>

            {/* Logout */}
            <button id="logout-btn" className="logout-btn" onClick={handleLogout}
              onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.18)'}
              onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.08)'}
            >
              Log out
            </button>
          </div>
        </header>

        {/* ── MESSAGES (scrollable, fills all space between header & footer) ── */}
        <main className="chat-messages" style={{ position: 'relative', zIndex: 1 }}>
          <div className="chat-list-inner">
            {messages.map((msg, idx) => (
              <div key={idx} className={`msg-row ${msg.role === 'user' ? 'user' : ''}`}>
                {/* Avatar */}
                <div className={`msg-avatar ${msg.role === 'ai' ? 'ai' : 'user-av'}`}>
                  {msg.role === 'ai' ? 'V' : (username?.[0]?.toUpperCase() || 'U')}
                </div>

                {/* Bubble + meta */}
                <div className={`msg-wrap ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  <div className={`msg-bubble ${msg.role === 'ai' ? 'ai' : 'user'}`}>
                    {msg.content}
                  </div>
                  <div className="msg-meta">
                    <span className="msg-time">{formatTime(new Date(msg.time))}</span>
                    {msg.role === 'ai' && (
                      <button
                        className={`play-btn ${playingIdx === idx ? 'active' : ''}`}
                        onClick={() => handlePlayMessage(msg, idx)}
                        title={playingIdx === idx ? 'Pause' : 'Play voice'}
                      >
                        {playingIdx === idx ? '⏸' : '▶'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="typing-row">
                <div className="msg-avatar ai">V</div>
                <div className="typing-bubble">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="typing-dot" style={{ animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* ── INPUT BAR (always pinned at bottom like WhatsApp) ── */}
        <footer className="chat-footer">
          {/* Status indicators */}
          {transcribing && (
            <div className="status-bar transcribing">
              <div className="status-indicator" style={{ background: '#818cf8', animation: 'pulse 1s infinite' }} />
              Transcribing your voice…
            </div>
          )}
          {recording && (
            <div className="status-bar recording">
              <div className="status-indicator" style={{ background: '#ef4444', animation: 'pulse 0.8s infinite' }} />
              Recording… {recordSeconds}s — tap mic to stop
            </div>
          )}

          <form onSubmit={handleSubmit} className="chat-compose">
            {/* Mic button */}
            <button
              type="button"
              id="mic-btn"
              className={`mic-btn ${recording ? 'active-rec' : 'idle'}`}
              onClick={handleMicClick}
              disabled={transcribing || loading}
              title={recording ? 'Stop recording' : 'Record voice message'}
            >
              {recording ? '⏹' : transcribing ? '⏳' : '🎤'}
            </button>

            {/* Text input */}
            <input
              id="chat-input"
              className="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recording ? 'Recording…' : transcribing ? 'Transcribing…' : 'Type a message…'}
              disabled={loading || recording}
              autoComplete="off"
            />

            {/* Send button — circle like WhatsApp */}
            <button
              type="submit"
              id="send-btn"
              className={`send-btn ${(!loading && input.trim() && !recording) ? 'ready' : 'disabled'}`}
              disabled={loading || !input.trim() || recording}
              title="Send"
            >
              {loading ? '⋯' : '➤'}
            </button>
          </form>
        </footer>
      </div>
    </>
  );
}
