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

  const safeUsername = String(username || 'anonymous').trim() || 'anonymous';

  await ensureTable();
  await pool.query(
    'INSERT INTO chat_queries (username, query_text, reply_text) VALUES (?, ?, ?)',
    [safeUsername, queryText.trim(), replyText?.trim() || null]
  );
}

export async function getChatQueries(limit = 200) {
  await ensureTable();

  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 1000) : 200;
  const [rows] = await pool.query(
    `SELECT c.username, u.email, c.query_text, c.reply_text, c.created_at
     FROM chat_queries c
     LEFT JOIN users u ON LOWER(TRIM(c.username)) = LOWER(TRIM(u.username))
     ORDER BY c.created_at DESC, c.id DESC LIMIT ?`,
    [safeLimit]
  );

  return rows;
}

const USER_DIRECTORY_SQL = `
  SELECT username, email, message_count, last_active
  FROM (
    SELECT
      u.username,
      u.email,
      COALESCE(stats.message_count, 0) AS message_count,
      stats.last_active
    FROM users u
    LEFT JOIN (
      SELECT username, COUNT(*) AS message_count, MAX(created_at) AS last_active
      FROM chat_queries
      GROUP BY username
    ) stats ON LOWER(TRIM(stats.username)) = LOWER(TRIM(u.username))

    UNION ALL

    SELECT
      stats.username,
      NULL AS email,
      stats.message_count,
      stats.last_active
    FROM (
      SELECT username, COUNT(*) AS message_count, MAX(created_at) AS last_active
      FROM chat_queries
      GROUP BY username
    ) stats
    LEFT JOIN users u ON LOWER(TRIM(u.username)) = LOWER(TRIM(stats.username))
    WHERE u.username IS NULL
  ) all_users
  ORDER BY message_count DESC, last_active DESC, username ASC
`;

const USER_DIRECTORY_FALLBACK_SQL = `
  SELECT
    c.username,
    u.email,
    COUNT(c.id) AS message_count,
    MAX(c.created_at) AS last_active
  FROM chat_queries c
  LEFT JOIN users u ON LOWER(TRIM(c.username)) = LOWER(TRIM(u.username))
  GROUP BY c.username, u.email
  ORDER BY last_active DESC, c.username ASC
`;

/**
 * Get every registered account, plus any chat-only identities.
 * Registered users appear even if they have never sent a message.
 */
export async function getUsers() {
  await ensureTable();

  try {
    const [rows] = await pool.query(USER_DIRECTORY_SQL);
    return rows;
  } catch (error) {
    console.error('User directory query failed, falling back to chat logs:', error);
    const [rows] = await pool.query(USER_DIRECTORY_FALLBACK_SQL);
    return rows;
  }
}

/**
 * Get aggregated analytics data for the analytics page.
 */
export async function getAnalyticsData() {
  await ensureTable();

  const [
    [totalRows],
    [dailyRows],
    [hourlyRows],
    topUserRows,
    [uniqueUserRows],
  ] = await Promise.all([
    // Overall message totals. Unique users come from the directory below
    // so registered accounts with 0 chats are still counted.
    pool.query(`
      SELECT
        COUNT(*) AS total_messages
      FROM chat_queries
    `),
    // Messages per day — last 30 days (IST offset +5:30 = +330 minutes)
    pool.query(`
      SELECT
        DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) AS day,
        COUNT(*) AS count
      FROM chat_queries
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY day
      ORDER BY day ASC
    `),
    // Messages by hour of day (IST)
    pool.query(`
      SELECT
        HOUR(CONVERT_TZ(created_at, '+00:00', '+05:30')) AS hour,
        COUNT(*) AS count
      FROM chat_queries
      GROUP BY hour
      ORDER BY hour ASC
    `),
    getUsers(),
    pool.query(`
      SELECT COUNT(*) AS new_users
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `).catch(() => [[{ new_users: 0 }]]),
  ]);

  return {
    totals: {
      total_messages: totalRows[0]?.total_messages || 0,
      total_users: topUserRows.length,
    },
    dailyActivity: dailyRows,
    hourlyActivity: hourlyRows,
    topUsers: topUserRows,
    newUsers: (uniqueUserRows[0] || { new_users: 0 }).new_users,
  };
}

/**
 * Get all messages for a specific user, ordered oldest-first.
 */
export async function getUserMessages(username, limit = 500) {
  await ensureTable();

  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 2000) : 500;
  const [rows] = await pool.query(
    'SELECT query_text, reply_text, created_at FROM chat_queries WHERE LOWER(TRIM(username)) = LOWER(TRIM(?)) ORDER BY created_at ASC, id ASC LIMIT ?',
    [username, safeLimit]
  );

  return rows;
}