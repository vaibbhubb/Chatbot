import 'server-only';
import { createHash } from 'crypto';
import { pool } from './db';

const CREATE_PASSWORD_RESET_CODES_TABLE = `
  CREATE TABLE IF NOT EXISTS password_reset_codes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    otp_hash CHAR(64) NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_user_created (user_id, created_at),
    INDEX idx_password_reset_expiry (expires_at)
  )
`;

let tableReadyPromise = null;

export function hashResetOtp(otp) {
  return createHash('sha256').update(otp).digest('hex');
}

export async function ensurePasswordResetTable() {
  if (!tableReadyPromise) {
    tableReadyPromise = pool.query(CREATE_PASSWORD_RESET_CODES_TABLE).catch((error) => {
      tableReadyPromise = null;
      throw error;
    });
  }

  await tableReadyPromise;
}
