import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import { pool } from '../../../lib/db';
import { ensurePasswordResetTable, hashResetOtp } from '../../../lib/password-reset';

const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function codesMatch(submittedCode, storedHash) {
  const submittedHash = Buffer.from(hashResetOtp(submittedCode), 'hex');
  const savedHash = Buffer.from(storedHash, 'hex');

  return submittedHash.length === savedHash.length && timingSafeEqual(submittedHash, savedHash);
}

export async function POST(req) {
  let connection;

  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidEmail(email) || !/^\d{6}$/.test(otp) || !password) {
      return Response.json(
        { success: false, error: 'Enter your email, the 6-digit code, and a new password.' },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return Response.json(
        { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    await ensurePasswordResetTable();
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query(
      'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      await connection.rollback();
      return Response.json(
        { success: false, error: 'The code is invalid or has expired. Request a new one and try again.' },
        { status: 400 }
      );
    }

    const user = users[0];
    const [codes] = await connection.query(
      `SELECT id, otp_hash, attempts FROM password_reset_codes
       WHERE user_id = ? AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [user.id]
    );

    const resetCode = codes[0];
    if (!resetCode || resetCode.attempts >= 5 || !codesMatch(otp, resetCode.otp_hash)) {
      if (resetCode && resetCode.attempts < 5) {
        await connection.query(
          'UPDATE password_reset_codes SET attempts = attempts + 1, is_used = attempts + 1 >= 5 WHERE id = ?',
          [resetCode.id]
        );
      }
      await connection.commit();
      return Response.json(
        { success: false, error: 'The code is invalid or has expired. Request a new one and try again.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [usedResult] = await connection.query(
      'UPDATE password_reset_codes SET is_used = TRUE WHERE id = ? AND is_used = FALSE',
      [resetCode.id]
    );

    if (usedResult.affectedRows !== 1) {
      await connection.rollback();
      return Response.json(
        { success: false, error: 'The code is invalid or has expired. Request a new one and try again.' },
        { status: 400 }
      );
    }

    await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
    await connection.commit();

    return Response.json({ success: true, message: 'Your password has been reset. You can sign in now.' });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // The transaction may already have been committed or rolled back.
      }
    }
    console.error('Reset password error:', error);
    return Response.json(
      { success: false, error: 'We could not reset your password. Please try again.' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
