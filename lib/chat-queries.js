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
    SELECT username, email, message_count, last_active
    FROM (
      SELECT
        u.username,
        u.email,
        COALESCE(stats.message_count, 0) AS message_count,
        stats.last_active,
        u.created_at AS registered_at
      FROM users u
      LEFT JOIN (
        SELECT username, COUNT(*) AS message_count, MAX(created_at) AS last_active
        FROM chat_queries
        GROUP BY username
      ) stats ON stats.username = u.username

      UNION ALL

      SELECT
        stats.username,
        NULL AS email,
        stats.message_count,
        stats.last_active,
        NULL AS registered_at
      FROM (
        SELECT username, COUNT(*) AS message_count, MAX(created_at) AS last_active
        FROM chat_queries
        GROUP BY username
      ) stats
      LEFT JOIN users u ON u.username = stats.username
      WHERE u.username IS NULL
    ) all_users
    ORDER BY COALESCE(last_active, registered_at) DESC
  `);

  return rows;
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
    [topUserRows],
    [uniqueUserRows],
  ] = await Promise.all([
    // Overall totals
    pool.query(`
      SELECT
        COUNT(*) AS total_messages,
        COUNT(DISTINCT username) AS total_users
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
    // All registered users, plus any legacy chat identities not in users.
    pool.query(`
      SELECT username, email, message_count, last_active
      FROM (
        SELECT
          u.username,
          u.email,
          COALESCE(stats.message_count, 0) AS message_count,
          stats.last_active,
          u.created_at AS registered_at
        FROM users u
        LEFT JOIN (
          SELECT username, COUNT(*) AS message_count, MAX(created_at) AS last_active
          FROM chat_queries
          GROUP BY username
        ) stats ON stats.username = u.username

        UNION ALL

        SELECT
          stats.username,
          NULL AS email,
          stats.message_count,
          stats.last_active,
          NULL AS registered_at
        FROM (
          SELECT username, COUNT(*) AS message_count, MAX(created_at) AS last_active
          FROM chat_queries
          GROUP BY username
        ) stats
        LEFT JOIN users u ON u.username = stats.username
        WHERE u.username IS NULL
      ) all_users
      ORDER BY message_count DESC, COALESCE(last_active, registered_at) DESC
    `),
    // Users registered in the last 30 days (from users table)
    pool.query(`
      SELECT COUNT(*) AS new_users
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `).catch(() => [[{ new_users: 0 }]]),
  ]);

  return {
    totals: totalRows[0] || { total_messages: 0, total_users: 0 },
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
    'SELECT query_text, reply_text, created_at FROM chat_queries WHERE username = ? ORDER BY created_at ASC, id ASC LIMIT ?',
    [username, safeLimit]
  );

  return rows;
}