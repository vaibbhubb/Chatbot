import { randomInt } from 'crypto';
import nodemailer from 'nodemailer';
import { pool } from '../../../lib/db';
import { ensurePasswordResetTable, hashResetOtp } from '../../../lib/password-reset';

const GENERIC_SUCCESS_MESSAGE = 'If an account uses that email address, a reset code has been sent.';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!isValidEmail(email)) {
      return Response.json(
        { success: false, error: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    await ensurePasswordResetTable();

    const [users] = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );

    // Do not reveal whether an email address has an account.
    if (users.length === 0) {
      return Response.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
    }

    const user = users[0];
    const [recentCodes] = await pool.query(
      `SELECT id FROM password_reset_codes
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );

    if (recentCodes.length > 0) {
      return Response.json({
        success: true,
        message: 'A reset code was sent recently. Please wait a minute before requesting another one.',
        retryAfterSeconds: 60,
      });
    }

    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const connection = await pool.getConnection();
    let resetCodeId;

    try {
      await connection.beginTransaction();
      await connection.query(
        'UPDATE password_reset_codes SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE',
        [user.id]
      );
      const [result] = await connection.query(
        'INSERT INTO password_reset_codes (user_id, otp_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, hashResetOtp(otp), expiresAt]
      );
      resetCodeId = result.insertId;
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"AI Vaibhav" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Reset your Chat with AI Vaibhav password',
        text: `Your password reset code is: ${otp}\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`,
      });
    } catch (emailError) {
      // A code that was never delivered must not stay usable.
      await pool.query('UPDATE password_reset_codes SET is_used = TRUE WHERE id = ?', [resetCodeId]);
      throw emailError;
    }

    return Response.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
  } catch (error) {
    console.error('Request password reset error:', error);
    return Response.json(
      { success: false, error: 'We could not send a reset code. Please try again.' },
      { status: 500 }
    );
  }
}
