"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Theme Definitions ─────────────────────────────────────────────────────────
const THEMES = {
  'green-black': {
    name: 'Green & Black',
    emoji: '🟢',
    preview: ['#050f05', '#00c853'],
    vars: {
      '--bg':               '#050f05',
      '--header-bg':        'rgba(5,15,5,0.97)',
      '--header-border':    'rgba(0,200,83,0.15)',
      '--msg-ai-bg':        'rgba(0,200,83,0.08)',
      '--msg-ai-border':    'rgba(0,200,83,0.15)',
      '--msg-user-from':    '#00873a',
      '--msg-user-to':      '#005c27',
      '--msg-user-shadow':  'rgba(0,200,83,0.3)',
      '--input-bg':         'rgba(0,200,83,0.06)',
      '--input-border':     'rgba(0,200,83,0.15)',
      '--input-focus':      'rgba(0,200,83,0.5)',
      '--text-primary':     '#e0ffe8',
      '--text-secondary':   'rgba(0,220,100,0.5)',
      '--accent':           '#00c853',
      '--accent-light':     '#00e676',
      '--accent-glow':      'rgba(0,200,83,0.35)',
      '--avatar-from':      '#005c27',
      '--avatar-to':        '#00873a',
      '--status-dot':       '#00e676',
      '--icon-btn-bg':      'rgba(0,200,83,0.08)',
      '--icon-btn-border':  'rgba(0,200,83,0.2)',
      '--badge-color':      '#00e676',
      '--typing-dot':       'rgba(0,200,83,0.7)',
      '--ambient-1':        'rgba(0,200,83,0.07)',
      '--ambient-2':        'rgba(0,150,60,0.05)',
      '--scrollbar':        'rgba(0,200,83,0.2)',
      '--settings-bg':      '#050f05',
    },
  },
  'yellow-black': {
    name: 'Yellow & Black',
    emoji: '🟡',
    preview: ['#0a0800', '#fbbf24'],
    vars: {
      '--bg':               '#0a0800',
      '--header-bg':        'rgba(10,8,0,0.97)',
      '--header-border':    'rgba(251,191,36,0.15)',
      '--msg-ai-bg':        'rgba(251,191,36,0.07)',
      '--msg-ai-border':    'rgba(251,191,36,0.15)',
      '--msg-user-from':    '#b45309',
      '--msg-user-to':      '#92400e',
      '--msg-user-shadow':  'rgba(251,191,36,0.3)',
      '--input-bg':         'rgba(251,191,36,0.06)',
      '--input-border':     'rgba(251,191,36,0.15)',
      '--input-focus':      'rgba(251,191,36,0.5)',
      '--text-primary':     '#fef9e7',
      '--text-secondary':   'rgba(251,191,36,0.5)',
      '--accent':           '#fbbf24',
      '--accent-light':     '#fde68a',
      '--accent-glow':      'rgba(251,191,36,0.35)',
      '--avatar-from':      '#92400e',
      '--avatar-to':        '#b45309',
      '--status-dot':       '#fde68a',
      '--icon-btn-bg':      'rgba(251,191,36,0.08)',
      '--icon-btn-border':  'rgba(251,191,36,0.2)',
      '--badge-color':      '#fde68a',
      '--typing-dot':       'rgba(251,191,36,0.7)',
      '--ambient-1':        'rgba(251,191,36,0.06)',
      '--ambient-2':        'rgba(180,83,9,0.04)',
      '--scrollbar':        'rgba(251,191,36,0.2)',
      '--settings-bg':      '#0a0800',
    },
  },
  'blue-black': {
    name: 'Blue & Black',
    emoji: '🔵',
    preview: ['#020b18', '#3b82f6'],
    vars: {
      '--bg':               '#020b18',
      '--header-bg':        'rgba(2,11,24,0.97)',
      '--header-border':    'rgba(59,130,246,0.15)',
      '--msg-ai-bg':        'rgba(59,130,246,0.08)',
      '--msg-ai-border':    'rgba(59,130,246,0.15)',
      '--msg-user-from':    '#1d4ed8',
      '--msg-user-to':      '#1e40af',
      '--msg-user-shadow':  'rgba(59,130,246,0.3)',
      '--input-bg':         'rgba(59,130,246,0.06)',
      '--input-border':     'rgba(59,130,246,0.15)',
      '--input-focus':      'rgba(59,130,246,0.5)',
      '--text-primary':     '#e0eeff',
      '--text-secondary':   'rgba(59,130,246,0.5)',
      '--accent':           '#3b82f6',
      '--accent-light':     '#93c5fd',
      '--accent-glow':      'rgba(59,130,246,0.35)',
      '--avatar-from':      '#1e40af',
      '--avatar-to':        '#1d4ed8',
      '--status-dot':       '#93c5fd',
      '--icon-btn-bg':      'rgba(59,130,246,0.08)',
      '--icon-btn-border':  'rgba(59,130,246,0.2)',
      '--badge-color':      '#93c5fd',
      '--typing-dot':       'rgba(59,130,246,0.7)',
      '--ambient-1':        'rgba(59,130,246,0.07)',
      '--ambient-2':        'rgba(30,64,175,0.05)',
      '--scrollbar':        'rgba(59,130,246,0.2)',
      '--settings-bg':      '#020b18',
    },
  },
  'blue-white': {
    name: 'Blue & White',
    emoji: '🩵',
    preview: ['#f0f7ff', '#2563eb'],
    vars: {
      '--bg':               '#f0f7ff',
      '--header-bg':        'rgba(240,247,255,0.97)',
      '--header-border':    'rgba(37,99,235,0.15)',
      '--msg-ai-bg':        'rgba(37,99,235,0.06)',
      '--msg-ai-border':    'rgba(37,99,235,0.15)',
      '--msg-user-from':    '#2563eb',
      '--msg-user-to':      '#1d4ed8',
      '--msg-user-shadow':  'rgba(37,99,235,0.25)',
      '--input-bg':         'rgba(37,99,235,0.06)',
      '--input-border':     'rgba(37,99,235,0.2)',
      '--input-focus':      'rgba(37,99,235,0.5)',
      '--text-primary':     '#1e293b',
      '--text-secondary':   'rgba(37,99,235,0.55)',
      '--accent':           '#2563eb',
      '--accent-light':     '#60a5fa',
      '--accent-glow':      'rgba(37,99,235,0.2)',
      '--avatar-from':      '#1d4ed8',
      '--avatar-to':        '#2563eb',
      '--status-dot':       '#22c55e',
      '--icon-btn-bg':      'rgba(37,99,235,0.08)',
      '--icon-btn-border':  'rgba(37,99,235,0.2)',
      '--badge-color':      '#2563eb',
      '--typing-dot':       'rgba(37,99,235,0.6)',
      '--ambient-1':        'rgba(37,99,235,0.05)',
      '--ambient-2':        'rgba(99,102,241,0.03)',
      '--scrollbar':        'rgba(37,99,235,0.2)',
      '--settings-bg':      '#f0f7ff',
    },
  },
  'green-white': {
    name: 'Green & White',
    emoji: '🍃',
    preview: ['#f0fdf4', '#16a34a'],
    vars: {
      '--bg':               '#f0fdf4',
      '--header-bg':        'rgba(240,253,244,0.97)',
      '--header-border':    'rgba(22,163,74,0.15)',
      '--msg-ai-bg':        'rgba(22,163,74,0.07)',
      '--msg-ai-border':    'rgba(22,163,74,0.15)',
      '--msg-user-from':    '#16a34a',
      '--msg-user-to':      '#15803d',
      '--msg-user-shadow':  'rgba(22,163,74,0.25)',
      '--input-bg':         'rgba(22,163,74,0.06)',
      '--input-border':     'rgba(22,163,74,0.2)',
      '--input-focus':      'rgba(22,163,74,0.5)',
      '--text-primary':     '#14532d',
      '--text-secondary':   'rgba(22,163,74,0.55)',
      '--accent':           '#16a34a',
      '--accent-light':     '#4ade80',
      '--accent-glow':      'rgba(22,163,74,0.2)',
      '--avatar-from':      '#15803d',
      '--avatar-to':        '#16a34a',
      '--status-dot':       '#22c55e',
      '--icon-btn-bg':      'rgba(22,163,74,0.08)',
      '--icon-btn-border':  'rgba(22,163,74,0.2)',
      '--badge-color':      '#15803d',
      '--typing-dot':       'rgba(22,163,74,0.6)',
      '--ambient-1':        'rgba(22,163,74,0.05)',
      '--ambient-2':        'rgba(21,128,61,0.03)',
      '--scrollbar':        'rgba(22,163,74,0.2)',
      '--settings-bg':      '#f0fdf4',
    },
  },
};

const DEFAULT_THEME = 'green-black';

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatUI({ username }) {
  const router = useRouter();

  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hey! I'm Vaibhav's AI clone. What's up?", time: new Date() },
  ]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme]           = useState(DEFAULT_THEME);

  // Load saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chat-theme');
    if (saved && THEMES[saved]) setTheme(saved);
  }, []);

  const applyTheme = (key) => {
    setTheme(key);
    localStorage.setItem('chat-theme', key);
  };

  const t = THEMES[theme];

  // ── Audio ──────────────────────────────────────────────────────────
  const [autoPlay, setAutoPlay]     = useState(false);
  const [playingIdx, setPlayingIdx] = useState(null);
  const synthRef  = useRef(null);
  const voiceRef  = useRef(null);

  useEffect(() => {
    const pick = () => {
      const v = window.speechSynthesis.getVoices();
      voiceRef.current =
        v.find(x => x.name.includes('Google') && x.lang.startsWith('en')) ||
        v.find(x => x.lang.startsWith('en-IN')) ||
        v.find(x => x.lang.startsWith('en')) ||
        v[0] || null;
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // ── Voice recording ────────────────────────────────────────────────
  const [recording, setRecording]       = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const recordTimerRef   = useRef(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // ── Scroll to bottom ───────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Speech synthesis ───────────────────────────────────────────────
  const speakText = useCallback((text, idx) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 1.05; u.pitch = 1.0; u.volume = 1.0;
    synthRef.current = u;
    setPlayingIdx(idx);
    u.onend  = () => setPlayingIdx(null);
    u.onerror = () => setPlayingIdx(null);
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setPlayingIdx(null); };

  // ── Send message ───────────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    if (!text?.trim() || loading) return;
    const userMsg = { role: 'user', content: text, time: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages([...updated, { role: 'ai', content: data.error || 'I had trouble replying. Try again.', time: new Date() }]);
        return;
      }
      if (data.reply) {
        const aiMsg  = { role: 'ai', content: data.reply, time: new Date() };
        const withAi = [...updated, aiMsg];
        setMessages(withAi);
        if (autoPlay) speakText(data.reply, withAi.length - 1);
      }
    } catch {
      setMessages([...updated, { role: 'ai', content: 'Connection error. Check your internet.', time: new Date() }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, autoPlay, speakText]);

  const handleSubmit  = (e) => { e.preventDefault(); handleSend(input); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } };
  const handlePlay    = (msg, idx) => { if (playingIdx === idx) stopSpeaking(); else speakText(msg.content, idx); };

  // ── Mic ────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      audioChunksRef.current   = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = async () => {
            const b64 = reader.result.split(',')[1];
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: b64, mimeType: 'audio/webm' }),
            });
            const data = await res.json();
            if (data.text) setInput(data.text);
            setTranscribing(false);
          };
        } catch { setTranscribing(false); }
      };
      mr.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch { alert('Microphone access denied.'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(recordTimerRef.current);
    setRecordSeconds(0);
  };

  const handleMicClick = () => { if (recording) stopRecording(); else startRecording(); };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  // ── Build CSS variable string ──────────────────────────────────────
  const cssVars = Object.entries(t.vars).map(([k, v]) => `${k}:${v}`).join(';');

  return (
    <>
      <style>{`
        /* ── CSS Variables (per theme) ──────────────────────────── */
        .chat-shell { ${cssVars} }

        /* ── Shell ─────────────────────────────────────────────── */
        .chat-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          height: 100dvh;
          background: var(--bg);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
          overflow: hidden;
          transition: background 0.35s ease, color 0.35s ease;
        }

        /* ── HEADER ─────────────────────────────────────────────── */
        .chat-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.7rem 1rem;
          background: var(--header-bg);
          border-bottom: 1px solid var(--header-border);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 20;
          gap: 0.5rem;
          transition: background 0.35s, border-color 0.35s;
        }

        .chat-header-left {
          display: flex; align-items: center;
          gap: 0.65rem; min-width: 0; flex: 1;
        }

        .chat-avatar-lg {
          width: 40px; height: 40px; border-radius: 50%;
          flex-shrink: 0;
          background: linear-gradient(135deg, var(--avatar-from) 0%, var(--avatar-to) 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          box-shadow: 0 0 18px var(--accent-glow);
          transition: box-shadow 0.35s, background 0.35s;
        }

        .chat-header-name {
          font-size: 0.95rem; font-weight: 700;
          color: var(--text-primary); white-space: nowrap;
          transition: color 0.35s;
        }

        .chat-header-status { display: flex; align-items: center; gap: 0.35rem; margin-top: 1px; }

        .status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--status-dot);
          box-shadow: 0 0 6px var(--status-dot);
          flex-shrink: 0;
          animation: pulseGlow 2s ease-in-out infinite;
          transition: background 0.35s;
        }

        .status-text { font-size: 0.68rem; color: var(--text-secondary); transition: color 0.35s; }

        .chat-header-right { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }

        .username-badge {
          padding: 0.22rem 0.6rem; border-radius: 20px;
          font-size: 0.68rem; font-weight: 700;
          color: var(--badge-color);
          background: var(--icon-btn-bg);
          border: 1px solid var(--icon-btn-border);
          white-space: nowrap;
          transition: all 0.35s;
        }

        .icon-btn {
          width: 34px; height: 34px; border-radius: 10px;
          border: 1px solid var(--icon-btn-border);
          background: var(--icon-btn-bg);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; transition: all 0.2s; flex-shrink: 0;
          color: var(--text-primary);
        }
        .icon-btn:hover { opacity: 0.7; transform: scale(0.95); }
        .icon-btn.active-audio { border-color: var(--accent); box-shadow: 0 0 8px var(--accent-glow); }

        .logout-btn {
          padding: 0.3rem 0.7rem; border-radius: 10px;
          border: 1px solid rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.08); color: #fca5a5;
          font-size: 0.75rem; font-weight: 500; cursor: pointer;
          font-family: inherit; transition: all 0.2s; white-space: nowrap;
        }
        .logout-btn:hover { background: rgba(239,68,68,0.18); }

        /* ── MESSAGES ───────────────────────────────────────────── */
        .chat-messages {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          padding: 1rem 0.75rem;
          display: flex; flex-direction: column; gap: 0.6rem;
          position: relative; z-index: 1;
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar) transparent;
        }
        .chat-messages::-webkit-scrollbar { width: 3px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 2px; }

        .chat-list-inner {
          max-width: 680px; width: 100%; margin: 0 auto;
          display: flex; flex-direction: column; gap: 0.5rem;
        }

        .msg-row { display: flex; align-items: flex-end; gap: 0.45rem; animation: msgIn 0.22s ease; }
        .msg-row.user { flex-direction: row-reverse; }

        .msg-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 700; color: #fff;
          transition: box-shadow 0.35s, background 0.35s;
        }
        .msg-avatar.ai {
          background: linear-gradient(135deg, var(--avatar-from), var(--avatar-to));
          box-shadow: 0 0 10px var(--accent-glow);
        }
        .msg-avatar.user-av { background: linear-gradient(135deg, #334155, #475569); }

        .msg-wrap { display: flex; flex-direction: column; max-width: min(75%, 460px); gap: 0.25rem; }
        .msg-wrap.user { align-items: flex-end; }
        .msg-wrap.ai   { align-items: flex-start; }

        .msg-bubble {
          padding: 0.65rem 0.9rem;
          font-size: 0.875rem; line-height: 1.55;
          word-break: break-word;
          transition: background 0.35s, border-color 0.35s;
        }
        .msg-bubble.ai {
          color: var(--text-primary);
          border-radius: 18px 18px 18px 4px;
          background: var(--msg-ai-bg);
          border: 1px solid var(--msg-ai-border);
        }
        .msg-bubble.user {
          color: #fff;
          border-radius: 18px 18px 4px 18px;
          background: linear-gradient(135deg, var(--msg-user-from), var(--msg-user-to));
          box-shadow: 0 4px 16px var(--msg-user-shadow);
        }

        .msg-meta { display: flex; align-items: center; gap: 0.4rem; padding: 0 0.2rem; }
        .msg-time { font-size: 0.6rem; color: var(--text-secondary); transition: color 0.35s; }

        .play-btn {
          background: var(--msg-ai-bg); border: 1px solid var(--msg-ai-border);
          border-radius: 6px; width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 0.6rem; color: var(--text-secondary);
          transition: all 0.15s; flex-shrink: 0;
        }
        .play-btn.active { background: var(--icon-btn-bg); color: var(--accent); border-color: var(--accent); }

        /* ── TYPING INDICATOR ───────────────────────────────────── */
        .typing-row { display: flex; align-items: flex-end; gap: 0.45rem; animation: msgIn 0.2s ease; }
        .typing-bubble {
          padding: 0.65rem 0.9rem;
          border-radius: 18px 18px 18px 4px;
          background: var(--msg-ai-bg); border: 1px solid var(--msg-ai-border);
          display: flex; gap: 5px; align-items: center;
          transition: background 0.35s;
        }
        .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--typing-dot); transition: background 0.35s; }

        /* ── INPUT BAR ──────────────────────────────────────────── */
        .chat-footer {
          flex-shrink: 0;
          background: var(--header-bg);
          border-top: 1px solid var(--header-border);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          padding: 0.65rem 0.75rem;
          padding-bottom: max(0.65rem, env(safe-area-inset-bottom));
          z-index: 20;
          transition: background 0.35s, border-color 0.35s;
        }

        .status-bar { max-width: 680px; margin: 0 auto 0.4rem; font-size: 0.72rem; display: flex; align-items: center; gap: 0.35rem; }
        .status-bar.recording   { color: #f87171; }
        .status-bar.transcribing { color: var(--accent-light); }
        .status-indicator { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        .chat-compose { max-width: 680px; margin: 0 auto; display: flex; gap: 0.5rem; align-items: center; }

        .mic-btn {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.05rem; cursor: pointer; transition: all 0.2s;
          border: 1px solid var(--input-border);
          background: var(--input-bg); color: var(--text-primary);
        }
        .mic-btn.active-rec {
          background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.5);
          box-shadow: 0 0 16px rgba(239,68,68,0.3);
        }
        .mic-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .chat-input {
          flex: 1; min-width: 0; height: 44px; padding: 0 0.9rem;
          border-radius: 22px;
          background: var(--input-bg); border: 1px solid var(--input-border);
          color: var(--text-primary); font-size: 0.875rem;
          outline: none; font-family: inherit;
          transition: border-color 0.2s, background 0.35s;
          -webkit-appearance: none;
        }
        .chat-input::placeholder { color: var(--text-secondary); }
        .chat-input:focus { border-color: var(--input-focus); }

        .send-btn {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          border: none; display: flex; align-items: center; justify-content: center;
          font-size: 1.05rem; cursor: pointer; transition: all 0.2s; color: #fff;
        }
        .send-btn.ready {
          background: linear-gradient(135deg, var(--msg-user-from), var(--msg-user-to));
          box-shadow: 0 4px 14px var(--accent-glow);
        }
        .send-btn.ready:hover { transform: scale(1.05); }
        .send-btn.disabled {
          background: var(--icon-btn-bg); border: 1px solid var(--input-border);
          cursor: not-allowed; color: var(--text-secondary);
        }

        /* ── SETTINGS PANEL ─────────────────────────────────────── */
        .settings-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 50; backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }

        .settings-panel {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(320px, 92vw);
          background: var(--settings-bg);
          border-left: 1px solid var(--header-border);
          z-index: 51;
          display: flex; flex-direction: column;
          animation: slideInRight 0.25s ease;
          overflow-y: auto;
          padding: 1.5rem 1.25rem;
          gap: 0;
          transition: background 0.35s;
        }

        .settings-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.75rem;
        }

        .settings-title {
          font-size: 1.1rem; font-weight: 800;
          color: var(--text-primary); letter-spacing: -0.01em;
          transition: color 0.35s;
        }

        .settings-close {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid var(--input-border);
          background: var(--input-bg); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; color: var(--text-primary);
          transition: all 0.2s;
        }
        .settings-close:hover { opacity: 0.7; }

        .settings-section {
          font-size: 0.7rem; font-weight: 800;
          color: var(--text-secondary); letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 0.85rem;
          transition: color 0.35s;
        }

        .theme-list { display: flex; flex-direction: column; gap: 0.55rem; }

        .theme-card {
          display: flex; align-items: center; gap: 0.9rem;
          padding: 0.8rem 1rem; border-radius: 14px;
          cursor: pointer;
          border: 2px solid transparent;
          background: var(--msg-ai-bg);
          transition: all 0.2s;
          user-select: none;
        }
        .theme-card.active { border-color: var(--accent); background: var(--icon-btn-bg); }
        .theme-card:not(.active):hover { opacity: 0.8; transform: translateX(2px); }

        .theme-swatch {
          width: 48px; height: 30px; border-radius: 8px;
          overflow: hidden; flex-shrink: 0;
          border: 1px solid var(--input-border);
          display: flex;
        }
        .theme-swatch-half { flex: 1; height: 100%; }

        .theme-name {
          flex: 1; font-size: 0.88rem; font-weight: 600;
          color: var(--text-primary); transition: color 0.35s;
        }

        .theme-check {
          font-size: 1rem; color: var(--accent);
          flex-shrink: 0; font-weight: 700;
        }

        /* ── Ambient blobs ──────────────────────────────────────── */
        .ambient {
          position: fixed; inset: 0;
          pointer-events: none; overflow: hidden; z-index: 0;
        }

        /* ── Animations ─────────────────────────────────────────── */
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }

        /* ── Mobile ─────────────────────────────────────────────── */
        @media (max-width: 480px) {
          .chat-header { padding: 0.6rem 0.75rem; }
          .chat-avatar-lg { width: 36px; height: 36px; font-size: 1rem; }
          .chat-header-name { font-size: 0.88rem; }
          .logout-btn { font-size: 0.7rem; padding: 0.25rem 0.55rem; }
          .username-badge { display: none; }
          .chat-messages { padding: 0.75rem 0.5rem; }
          .msg-bubble { font-size: 0.845rem; padding: 0.6rem 0.8rem; }
          .chat-footer { padding: 0.55rem 0.6rem; padding-bottom: max(0.55rem, env(safe-area-inset-bottom)); }
          .settings-panel { width: 92vw; }
        }
      `}</style>

      <div className="chat-shell">
        {/* ── Ambient glow blobs ── */}
        <div className="ambient">
          <div style={{
            position: 'absolute', top: '-20%', left: '-10%',
            width: '60vw', height: '60vw', borderRadius: '50%',
            background: `radial-gradient(circle, ${t.vars['--ambient-1']} 0%, transparent 70%)`,
            filter: 'blur(40px)', transition: 'background 0.5s',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', right: '-10%',
            width: '50vw', height: '50vw', borderRadius: '50%',
            background: `radial-gradient(circle, ${t.vars['--ambient-2']} 0%, transparent 70%)`,
            filter: 'blur(40px)', transition: 'background 0.5s',
          }} />
        </div>

        {/* ══════════════ HEADER ══════════════ */}
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
              className={`icon-btn ${autoPlay ? 'active-audio' : ''}`}
              onClick={() => setAutoPlay(p => !p)}
              title={autoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
            >
              {autoPlay ? '🔊' : '🔇'}
            </button>

            {/* Settings button */}
            <button
              id="settings-btn"
              className="icon-btn"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              ⚙️
            </button>

            {/* Logout */}
            <button id="logout-btn" className="logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        {/* ══════════════ MESSAGES ══════════════ */}
        <main className="chat-messages">
          <div className="chat-list-inner">
            {messages.map((msg, idx) => (
              <div key={idx} className={`msg-row${msg.role === 'user' ? ' user' : ''}`}>
                <div className={`msg-avatar${msg.role === 'ai' ? ' ai' : ' user-av'}`}>
                  {msg.role === 'ai' ? 'V' : (username?.[0]?.toUpperCase() || 'U')}
                </div>
                <div className={`msg-wrap${msg.role === 'user' ? ' user' : ' ai'}`}>
                  <div className={`msg-bubble${msg.role === 'ai' ? ' ai' : ' user'}`}>
                    {msg.content}
                  </div>
                  <div className="msg-meta">
                    <span className="msg-time">{formatTime(new Date(msg.time))}</span>
                    {msg.role === 'ai' && (
                      <button
                        className={`play-btn${playingIdx === idx ? ' active' : ''}`}
                        onClick={() => handlePlay(msg, idx)}
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
                    <div key={i} className="typing-dot"
                      style={{ animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* ══════════════ INPUT BAR ══════════════ */}
        <footer className="chat-footer">
          {transcribing && (
            <div className="status-bar transcribing">
              <div className="status-indicator" style={{ background: 'var(--accent)', animation: 'pulseGlow 1s infinite' }} />
              Transcribing your voice…
            </div>
          )}
          {recording && (
            <div className="status-bar recording">
              <div className="status-indicator" style={{ background: '#ef4444', animation: 'pulseGlow 0.8s infinite' }} />
              Recording… {recordSeconds}s — tap mic to stop
            </div>
          )}

          <form onSubmit={handleSubmit} className="chat-compose">
            <button
              type="button" id="mic-btn"
              className={`mic-btn${recording ? ' active-rec' : ''}`}
              onClick={handleMicClick}
              disabled={transcribing || loading}
              title={recording ? 'Stop recording' : 'Record voice'}
            >
              {recording ? '⏹' : transcribing ? '⏳' : '🎤'}
            </button>

            <input
              id="chat-input" className="chat-input" type="text"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recording ? 'Recording…' : transcribing ? 'Transcribing…' : 'Type a message…'}
              disabled={loading || recording}
              autoComplete="off"
            />

            <button
              type="submit" id="send-btn"
              className={`send-btn${(!loading && input.trim() && !recording) ? ' ready' : ' disabled'}`}
              disabled={loading || !input.trim() || recording}
              title="Send"
            >
              {loading ? '⋯' : '➤'}
            </button>
          </form>
        </footer>

        {/* ══════════════ SETTINGS PANEL ══════════════ */}
        {showSettings && (
          <>
            {/* Overlay */}
            <div className="settings-overlay" onClick={() => setShowSettings(false)} />

            {/* Panel */}
            <div className="settings-panel">
              <div className="settings-head">
                <span className="settings-title">⚙️ Settings</span>
                <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
              </div>

              <div className="settings-section">🎨 Theme</div>
              <div className="theme-list">
                {Object.entries(THEMES).map(([key, td]) => (
                  <div
                    key={key}
                    className={`theme-card${theme === key ? ' active' : ''}`}
                    onClick={() => applyTheme(key)}
                    role="button"
                    aria-pressed={theme === key}
                  >
                    {/* Color swatch */}
                    <div className="theme-swatch">
                      <div className="theme-swatch-half" style={{ background: td.preview[0] }} />
                      <div className="theme-swatch-half" style={{ background: td.preview[1] }} />
                    </div>

                    {/* Emoji + name */}
                    <span className="theme-name">{td.emoji} {td.name}</span>

                    {/* Active checkmark */}
                    {theme === key && <span className="theme-check">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
