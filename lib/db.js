import mysql from 'mysql2/promise';

const sslEnabled = process.env.DB_SSL !== 'false';
const sslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED
  ? process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  : process.env.NODE_ENV !== 'production';

const sslConfig = sslEnabled
  ? {
      rejectUnauthorized: sslRejectUnauthorized,
    }
  : undefined;

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
});