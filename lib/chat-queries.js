import 'server-only';
import { pool } from './db';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS chat_queries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    query_text TEXT NOT NULL,
    reply_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_username (username(100))
  )
`;

// One-time migration: add reply_text column if table already exists without it
const ADD_REPLY_COLUMN_SQL = `
  ALTER TABLE chat_queries ADD COLUMN IF NOT EXISTS reply_text TEXT AFTER query_text
`;

let tableReadyPromise = null;

async function ensureTable() {
  if (!tableReadyPromise) {
    tableReadyPromise = (async () => {
      await pool.query(CREATE_TABLE_SQL);
      // Safe migration for existing tables — TiDB/MySQL ignores if column exists
      try {
        await pool.query(ADD_REPLY_COLUMN_SQL);
      } catch {
        // Column may already exist or syntax not supported — that's fine
      }
    })().catch((error) => {
      tableReadyPromise = null;
      throw error;
    });
  }

  return tableReadyPromise;
}

export async function logChatQuery({ username, queryText, replyText }) {
  if (!queryText?.trim()) return;

  await ensureTable();
  await pool.query(
    'INSERT INTO chat_queries (username, query_text, reply_text) VALUES (?, ?, ?)',
    [username || 'anonymous', queryText.trim(), replyText?.trim() || null]
  );
}

export async function getChatQueries(limit = 200) {
  await ensureTable();

  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 1000) : 200;
  const [rows] = await pool.query(
    `SELECT c.username, u.email, c.query_text, c.reply_text, c.created_at 
     FROM chat_queries c 
     LEFT JOIN users u ON c.username = u.username 
     ORDER BY c.created_at DESC, c.id DESC LIMIT ?`,
    [safeLimit]
  );

  return rows;
}

/**
 * Get all unique users with stats (message count, last active).
 */
export async function getUsers() {
  await ensureTable();

  const [rows] = await pool.query(`
    SELECT
      c.username,
      u.email,
      COUNT(c.id) AS message_count,
      MAX(c.created_at) AS last_active
    FROM chat_queries c
    LEFT JOIN users u ON c.username = u.username
    GROUP BY c.username, u.email
    ORDER BY last_active DESC
  `);

  return rows;
}

/**
 * Get all messages for a specific user, ordered oldest-first.
 */
export async function getUserMessages(username, limit = 500) {
  await ensureTable();

  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 2000) : 500;
  const [rows] = await pool.query(
    'SELECT query_text, reply_text, created_at FROM chat_queries WHERE username = ? ORDER BY created_at ASC, id ASC LIMIT ?',
    [username, safeLimit]
  );

  return rows;
}