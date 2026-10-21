"use client";

import { useState, useEffect } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data, color = "#6366f1", labelKey = "day", valueKey = "count", height = 160, showLabels = true, xLabelEvery = 1 }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey])), 1);
  const barW = 100 / Math.max(data.length, 1);

  return (
    <svg viewBox={`0 0 100 ${height + (showLabels ? 24 : 4)}`} preserveAspectRatio="none" style={{ width: "100%", height: showLabels ? height + 24 : height + 4 }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const barH = Math.max((val / max) * height * 0.92, val > 0 ? 2 : 0);
        const x = i * barW;
        const y = height - barH;
        const showLabel = showLabels && i % xLabelEvery === 0;
        const label = String(d[labelKey]);
        const displayLabel = labelKey === "day" ? formatDay(label) : `${label}h`;
        return (
          <g key={i}>
            <rect
              x={x + barW * 0.1}
              y={y}
              width={barW * 0.8}
              height={barH}
              rx="1"
              fill={color}
              opacity="0.85"
            >
              <title>{`${displayLabel}: ${val}`}</title>
            </rect>
            {showLabel && (
              <text
                x={x + barW / 2}
                y={height + 18}
                textAnchor="middle"
                fontSize="4"
                fill="rgba(255,255,255,0.35)"
              >
                {displayLabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent = "#6366f1" }) {
  return (
    <div className="an-stat">
      <div className="an-stat-icon" style={{ background: `${accent}22`, color: accent }}>
        {icon}
      </div>
      <div>
        <div className="an-stat-val">{value}</div>
        <div className="an-stat-lbl">{label}</div>
        {sub && <div className="an-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .an-root {
    min-height: 100vh;
    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%),
                linear-gradient(180deg, #07091a 0%, #0c1128 50%, #07091a 100%);
    color: #e2e8f0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .an-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
  }

  /* ── Header ── */
  .an-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
  }
  .an-eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(99,102,241,0.7);
    font-weight: 600;
    margin-bottom: 0.35rem;
  }
  .an-title {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.03em;
  }
  .an-subtitle {
    margin: 0.4rem 0 0;
    color: rgba(255,255,255,0.4);
    font-size: 0.88rem;
  }
  .an-nav {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .an-nav-link {
    padding: 0.5rem 0.9rem;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.55);
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
  }
  .an-nav-link:hover { background: rgba(255,255,255,0.08); color: #fff; }
  .an-logout {
    padding: 0.5rem 0.9rem;
    border-radius: 10px;
    border: 1px solid rgba(239,68,68,0.2);
    background: rgba(239,68,68,0.05);
    color: rgba(239,68,68,0.7);
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 500;
    transition: all 0.2s;
  }
  .an-logout:hover { background: rgba(239,68,68,0.12); color: #fca5a5; }

  /* ── Stats grid ── */
  .an-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  .an-stat {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.1rem 1.25rem;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(12px);
    transition: border-color 0.2s, background 0.2s;
  }
  .an-stat:hover { border-color: rgba(99,102,241,0.2); background: rgba(99,102,241,0.04); }
  .an-stat-icon {
    width: 42px; height: 42px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  .an-stat-val {
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }
  .an-stat-lbl {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 0.2rem;
  }
  .an-stat-sub {
    font-size: 0.72rem;
    color: rgba(99,102,241,0.7);
    margin-top: 0.15rem;
  }

  /* ── Section header ── */
  .an-section-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .an-section-title span {
    color: rgba(255,255,255,0.35);
    font-size: 0.78rem;
    font-weight: 400;
  }

  /* ── Glass panels ── */
  .an-glass {
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(14px);
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.25rem;
    overflow: hidden;
  }

  /* ── Chart grid ── */
  .an-chart-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }

  /* ── Top users list ── */
  .an-user-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .an-user-row:last-child { border-bottom: none; }
  .an-user-rank {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.25);
    width: 18px;
    text-align: center;
    flex-shrink: 0;
  }
  .an-user-av {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.85rem; color: #fff;
    flex-shrink: 0;
  }
  .an-user-av.gold   { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
  .an-user-av.silver { background: linear-gradient(135deg, #94a3b8, #cbd5e1); }
  .an-user-av.bronze { background: linear-gradient(135deg, #92400e, #b45309); }
  .an-user-info { flex: 1; min-width: 0; }
  .an-user-name { font-weight: 600; color: #fff; font-size: 0.9rem; }
  .an-user-email { font-size: 0.73rem; color: rgba(255,255,255,0.3); margin-top: 0.1rem; }
  .an-user-bar-wrap {
    flex: 1;
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 999px;
    overflow: hidden;
    min-width: 60px;
    max-width: 140px;
  }
  .an-user-bar { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 0.6s cubic-bezier(.4,0,.2,1); }
  .an-user-count {
    font-size: 0.78rem;
    font-weight: 700;
    color: #a5b4fc;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .an-user-time {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.3);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── Empty state ── */
  .an-empty {
    padding: 2.5rem;
    text-align: center;
    color: rgba(255,255,255,0.3);
    font-size: 0.9rem;
  }

  /* ── Responsive ── */
  @media (max-width: 700px) {
    .an-chart-grid { grid-template-columns: 1fr; }
    .an-stats { grid-template-columns: 1fr 1fr; }
    .an-title { font-size: 1.4rem; }
  }
  @media (max-width: 420px) {
    .an-stats { grid-template-columns: 1fr; }
  }
`;

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnalyticsView({ analytics }) {
  const [liveAnalytics, setLiveAnalytics] = useState(analytics);
  const [userSearch, setUserSearch] = useState("");
  const totals = liveAnalytics?.totals || { total_messages: 0, total_users: 0 };
  const dailyActivity = liveAnalytics?.dailyActivity || [];
  const hourlyActivity = liveAnalytics?.hourlyActivity || [];
  const topUsers = Array.isArray(liveAnalytics?.topUsers) ? liveAnalytics.topUsers : [];

  useEffect(() => {
    setLiveAnalytics(analytics);
  }, [analytics]);

  useEffect(() => {
    let active = true;

    const refreshAnalytics = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics', { cache: 'no-store' });
        if (!response.ok) return;
        const nextAnalytics = await response.json();
        if (active) setLiveAnalytics(nextAnalytics);
      } catch {
        // Keep showing the latest successful snapshot if a refresh fails.
      }
    };

    refreshAnalytics();
    const intervalId = window.setInterval(refreshAnalytics, 10_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshAnalytics();
    };
    window.addEventListener('focus', refreshAnalytics);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshAnalytics);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Fill missing days in the last 30 days so chart is continuous
  const filledDailyActivity = (() => {
    const map = {};
    dailyActivity.forEach((d) => { map[String(d.day).slice(0, 10)] = Number(d.count); });
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      result.push({ day: key, count: map[key] || 0 });
    }
    return result;
  })();

  // Fill all 24 hours
  const filledHourlyActivity = (() => {
    const map = {};
    hourlyActivity.forEach((d) => { map[Number(d.hour)] = Number(d.count); });
    return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: map[h] || 0 }));
  })();

  const visibleUsers = topUsers.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.username || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q)
    );
  });
  const maxUser = topUsers.length > 0 ? Math.max(...topUsers.map((u) => Number(u.message_count) || 0), 1) : 1;
  const avgMessagesPerUser = totals.total_users > 0
    ? (Number(totals.total_messages) / Number(totals.total_users)).toFixed(1)
    : "0";

  return (
    <div className="an-root">
      <style>{STYLES}</style>
      <div className="an-inner">

        {/* ── Header ── */}
        <div className="an-header">
          <div>
            <div className="an-eyebrow">📊 Private Analytics</div>
            <h1 className="an-title">AI Vaibhav — Analytics</h1>
            <p className="an-subtitle">Real-time insights from your chatbot&apos;s usage.</p>
          </div>
          <div className="an-nav">
            <a href="/dashboard" className="an-nav-link">👥 Users</a>
            <form action="/api/dashboard/logout" method="post" style={{ margin: 0 }}>
              <button type="submit" className="an-logout">Log out</button>
            </form>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="an-stats">
          <StatCard
            icon="💬"
            label="Total Messages"
            value={Number(totals.total_messages).toLocaleString()}
            sub={`avg ${avgMessagesPerUser} per user`}
            accent="#6366f1"
          />
          <StatCard
            icon="👥"
            label="Unique Users"
            value={Number(totals.total_users).toLocaleString()}
            accent="#8b5cf6"
          />
          <StatCard
            icon="🔥"
            label="Last 30 Days"
            value={filledDailyActivity.reduce((s, d) => s + d.count, 0).toLocaleString()}
            sub="messages"
            accent="#f59e0b"
          />
          <StatCard
            icon="📅"
            label="Today (IST)"
            value={(() => {
              const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
              return (filledDailyActivity.find((d) => d.day === today)?.count || 0).toLocaleString();
            })()}
            sub="messages"
            accent="#10b981"
          />
        </div>

        {/* ── Charts ── */}
        <div className="an-chart-grid">
          {/* Daily activity */}
          <div className="an-glass">
              <div className="an-section-title">
                📈 Daily Activity <span>last 30 days</span>
            </div>
            {filledDailyActivity.every((d) => d.count === 0) ? (
              <div className="an-empty">No data yet.</div>
            ) : (
              <BarChart
                data={filledDailyActivity}
                color="#6366f1"
                labelKey="day"
                valueKey="count"
                height={140}
                showLabels={true}
                xLabelEvery={5}
              />
            )}
          </div>

          {/* Hourly heatmap */}
          <div className="an-glass">
            <div className="an-section-title">
              🕐 Activity by Hour <span>IST, all time</span>
            </div>
            {filledHourlyActivity.every((d) => d.count === 0) ? (
              <div className="an-empty">No data yet.</div>
            ) : (
              <BarChart
                data={filledHourlyActivity}
                color="#8b5cf6"
                labelKey="hour"
                valueKey="count"
                height={140}
                showLabels={true}
                xLabelEvery={3}
              />
            )}
          </div>
        </div>

        {/* ── Top Users ── */}
        <div className="an-glass">
          <div className="an-section-title">
            🏆 Users <span>{topUsers.length} accounts, including signups with 0 messages</span>
          </div>
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search username or email"
            style={{
              width: "100%",
              marginBottom: "0.85rem",
              padding: "0.65rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              fontSize: "0.88rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {topUsers.length === 0 ? (
            <div className="an-empty">No users yet.</div>
          ) : visibleUsers.length === 0 ? (
            <div className="an-empty">No user matches that username or email.</div>
          ) : (
            visibleUsers.map((u, i) => {
              const pct = (Number(u.message_count) / maxUser) * 100;
              const avClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1);
              return (
                <div key={`${u.username}-${u.email || ""}`} className="an-user-row">
                  <div className="an-user-rank">{medal}</div>
                  <div className={`an-user-av ${avClass}`}>
                    {u.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="an-user-info">
                    <div className="an-user-name">@{u.username}</div>
                    {u.email && <div className="an-user-email">{u.email}</div>}
                  </div>
                  <div className="an-user-bar-wrap">
                    <div className="an-user-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="an-user-count">{Number(u.message_count).toLocaleString()} msgs</div>
                  <div className="an-user-time">{timeAgo(u.last_active)}</div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
