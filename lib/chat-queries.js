import 'server-only';
import { pool } from './db';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS chat_queries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    query_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_username (username(100))
  )
`;

let tableReadyPromise = null;

async function ensureTable() {
  if (!tableReadyPromise) {
    tableReadyPromise = pool.query(CREATE_TABLE_SQL).catch((error) => {
      tableReadyPromise = null;
      throw error;
    });
  }

  return tableReadyPromise;
}

export async function logChatQuery({ username, queryText }) {
  if (!queryText?.trim()) return;

  await ensureTable();
  await pool.query(
    'INSERT INTO chat_queries (username, query_text) VALUES (?, ?)',
    [username || 'anonymous', queryText.trim()]
  );
}

export async function getChatQueries(limit = 200) {
  await ensureTable();

  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 1000) : 200;
  const [rows] = await pool.query(
    'SELECT username, query_text, created_at FROM chat_queries ORDER BY created_at DESC, id DESC LIMIT ?',
    [safeLimit]
  );

  return rows;
}