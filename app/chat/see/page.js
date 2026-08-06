import DashboardLoginForm from './DashboardLoginForm';
import { getChatSeeSession } from '../../../lib/chat-see-session';
import { getChatQueries } from '../../../lib/chat-queries';

export const metadata = {
  title: 'Chat Query Dashboard',
  description: 'View user queries sent to the bot.',
};

export default async function ChatSeePage() {
  const session = await getChatSeeSession();

  if (!session) {
    return <DashboardLoginForm />;
  }

  const queries = await getChatQueries(500);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #050816 0%, #0b1020 45%, #050816 100%)',
      color: '#e2e8f0',
      padding: '1.25rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Private dashboard</div>
            <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', color: '#fff' }}>User queries</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.45)' }}>Latest messages users sent to the bot.</p>
          </div>

          <form action="/api/chat-see/logout" method="post">
            <button
              type="submit"
              style={{
                padding: '0.7rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </form>
        </div>

        <div style={{
          overflowX: 'auto',
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Query</th>
              </tr>
            </thead>
            <tbody>
              {queries.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)' }}>
                    No chat queries logged yet.
                  </td>
                </tr>
              ) : (
                queries.map((row, index) => (
                  <tr key={`${row.created_at}-${index}`} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={tdStyle}>{new Date(row.created_at).toLocaleString()}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#a5b4fc' }}>@{row.username}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{row.query_text}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '0.9rem 1rem',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.55)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const tdStyle = {
  padding: '0.95rem 1rem',
  fontSize: '0.92rem',
  color: '#e2e8f0',
  verticalAlign: 'top',
};