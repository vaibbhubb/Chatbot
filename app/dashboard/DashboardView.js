"use client";

import { useState, useEffect } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  .dash { min-height: 100vh; background: linear-gradient(180deg, #050816 0%, #0b1020 45%, #050816 100%); color: #e2e8f0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  .dash-inner { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }

  /* Header */
  .dash-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .dash-label { font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.35); }
  .dash-title { margin: 0.2rem 0 0; font-size: 1.6rem; font-weight: 700; color: #fff; }
  .dash-sub { margin: 0.25rem 0 0; color: rgba(255,255,255,0.4); font-size: 0.88rem; }
  .dash-logout { padding: 0.6rem 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; font-size: 0.85rem; transition: background 0.2s; }
  .dash-logout:hover { background: rgba(255,255,255,0.1); }

  /* Tabs */
  .tabs { display: flex; gap: 0.4rem; margin-bottom: 1.25rem; }
  .tab { padding: 0.55rem 1.1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5); cursor: pointer; font-size: 0.82rem; font-weight: 600; transition: all 0.2s; }
  .tab:hover { background: rgba(255,255,255,0.06); color: #fff; }
  .tab.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #a5b4fc; }

  /* Stats row */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.8rem; margin-bottom: 1.5rem; }
  .stat-card { padding: 1rem 1.1rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); }
  .stat-val { font-size: 1.5rem; font-weight: 700; color: #fff; }
  .stat-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.15rem; }

  /* Card / glass panel */
  .glass { border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); backdrop-filter: blur(14px); overflow: hidden; }

  /* User list */
  .user-row { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: background 0.15s; }
  .user-row:last-child { border-bottom: none; }
  .user-row:hover { background: rgba(99,102,241,0.08); }
  .user-av { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; color: #fff; flex-shrink: 0; }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-weight: 600; color: #fff; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; }
  .user-email { font-size: 0.75rem; color: rgba(255,255,255,0.3); font-weight: 400; }
  .user-meta { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 0.1rem; }
  .user-count { background: rgba(99,102,241,0.15); color: #a5b4fc; border-radius: 20px; padding: 0.25rem 0.7rem; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }

  /* Conversation view */
  .conv-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .back-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: background 0.2s; flex-shrink: 0; }
  .back-btn:hover { background: rgba(255,255,255,0.1); }
  .conv-title { font-weight: 700; color: #fff; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem; }
  .conv-subtitle { font-size: 0.78rem; color: rgba(255,255,255,0.4); }

  .msg-list { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; max-height: 65vh; overflow-y: auto; }
  .msg-item { max-width: 85%; }
  .msg-item.user { align-self: flex-end; }
  .msg-item.bot { align-self: flex-start; }
  .msg-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.3rem; }
  .msg-label.user { color: #818cf8; text-align: right; }
  .msg-label.bot { color: rgba(255,255,255,0.35); }
  .msg-bubble { padding: 0.75rem 1rem; border-radius: 14px; font-size: 0.9rem; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
  .msg-bubble.user { background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; border-bottom-right-radius: 4px; }
  .msg-bubble.bot { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; border-bottom-left-radius: 4px; }
  .msg-time { font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-top: 0.3rem; }
  .msg-time.user { text-align: right; }

  .empty { padding: 3rem 1rem; text-align: center; color: rgba(255,255,255,0.35); font-size: 0.95rem; }
  .loading { padding: 2rem; text-align: center; color: rgba(255,255,255,0.4); }

  /* Recent queries table */
  .q-table { width: 100%; border-collapse: collapse; min-width: 700px; }
  .q-table th { text-align: left; padding: 0.8rem 1rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.45); border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); }
  .q-table td { padding: 0.85rem 1rem; font-size: 0.88rem; color: #e2e8f0; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .q-table tr:hover td { background: rgba(255,255,255,0.02); }
  .q-user { font-weight: 700; color: #a5b4fc; display: flex; flex-direction: column; gap: 0.1rem; }

  @media (max-width: 640px) {
    .dash-inner { padding: 1rem 0.75rem 2rem; }
    .dash-title { font-size: 1.3rem; }
    .stats { grid-template-columns: 1fr 1fr; }
    .msg-item { max-width: 95%; }
  }
`;

// ── Main Component ───────────────────────────────────────────────────────────
export default function DashboardView({ users, recentQueries }) {
  const [tab, setTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMessages, setUserMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Handle browser back button properly
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view === 'conversation') {
        // Handled below if we wanted to support direct deep linking, but typically
        // if they hit back, we just want to clear the selected user.
      } else {
        setSelectedUser(null);
        setUserMessages([]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const totalMessages = users.reduce(
    (sum, u) => sum + Number(u.message_count),
    0
  );

  async function openUser(username) {
    setSelectedUser(username);
    // Push state so browser back button works
    window.history.pushState({ view: 'conversation', username }, '', window.location.pathname);
    
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/dashboard/messages?username=${encodeURIComponent(username)}`
      );
      const data = await res.json();
      setUserMessages(data.messages || []);
    } catch {
      setUserMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  function closeUser() {
    setSelectedUser(null);
    setUserMessages([]);
    // If we're closing via the button, replace state or go back
    if (window.history.state?.view === 'conversation') {
      window.history.back();
    }
  }

  return (
    <div className="dash">
      <style>{STYLES}</style>
      <div className="dash-inner">
        {/* ── Header ── */}
        <div className="dash-header">
          <div>
            <div className="dash-label">Private dashboard</div>
            <h1 className="dash-title">AI Vaibhav — Admin</h1>
            <p className="dash-sub">
              See who's chatting with your bot and what they're saying.
            </p>
          </div>
          <form action="/api/dashboard/logout" method="post">
            <button type="submit" className="dash-logout">
              Log out
            </button>
          </form>
        </div>

        {/* ── Stats ── */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-val">{users.length}</div>
            <div className="stat-lbl">Total users</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{totalMessages}</div>
            <div className="stat-lbl">Total messages</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">
              {users.length > 0 ? timeAgo(users[0].last_active) : "—"}
            </div>
            <div className="stat-lbl">Last activity</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        {!selectedUser && (
          <div className="tabs">
            <button
              className={`tab ${tab === "users" ? "active" : ""}`}
              onClick={() => setTab("users")}
            >
              👥 Users
            </button>
            <button
              className={`tab ${tab === "recent" ? "active" : ""}`}
              onClick={() => setTab("recent")}
            >
              💬 Recent queries
            </button>
          </div>
        )}

        {/* ── User conversation view ── */}
        {selectedUser ? (
          <div className="glass">
            <div className="conv-header">
              <button className="back-btn" onClick={closeUser}>
                ←
              </button>
              <div>
                <div className="conv-title">@{selectedUser}</div>
                <div className="conv-subtitle">
                  {userMessages.length} messages
                </div>
              </div>
            </div>

            {loadingMessages ? (
              <div className="loading">Loading messages…</div>
            ) : userMessages.length === 0 ? (
              <div className="empty">No messages found.</div>
            ) : (
              <div className="msg-list">
                {userMessages.map((msg, i) => (
                  <div key={i}>
                    {/* User message */}
                    <div className="msg-item user">
                      <div className="msg-label user">@{selectedUser}</div>
                      <div className="msg-bubble user">{msg.query_text}</div>
                      <div className="msg-time user">
                        {formatDate(msg.created_at)}
                      </div>
                    </div>

                    {/* Bot reply */}
                    {msg.reply_text && (
                      <div className="msg-item bot" style={{ marginTop: "0.5rem" }}>
                        <div className="msg-label bot">AI Vaibhav</div>
                        <div className="msg-bubble bot">{msg.reply_text}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === "users" ? (
          /* ── User list ── */
          <div className="glass">
            {users.length === 0 ? (
              <div className="empty">No users yet.</div>
            ) : (
              users.map((u, i) => (
                <div
                  key={i}
                  className="user-row"
                  onClick={() => openUser(u.username)}
                >
                  <div className="user-av">
                    {u.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      @{u.username}
                      {u.email && <span className="user-email">({u.email})</span>}
                    </div>
                    <div className="user-meta">
                      Last active {timeAgo(u.last_active)}
                    </div>
                  </div>
                  <div className="user-count">
                    {u.message_count} msgs
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ── Recent queries table ── */
          <div className="glass" style={{ overflowX: "auto" }}>
            <table className="q-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Message</th>
                  <th>Bot reply</th>
                </tr>
              </thead>
              <tbody>
                {recentQueries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "1.5rem",
                        textAlign: "center",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      No queries yet.
                    </td>
                  </tr>
                ) : (
                  recentQueries.map((row, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                        {formatDate(row.created_at)}
                      </td>
                      <td className="q-user">
                        @{row.username}
                        {row.email && <span className="user-email">({row.email})</span>}
                      </td>
                      <td
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxWidth: "300px",
                        }}
                      >
                        {row.query_text}
                      </td>
                      <td
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxWidth: "300px",
                          color: "rgba(255,255,255,0.55)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {row.reply_text || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
