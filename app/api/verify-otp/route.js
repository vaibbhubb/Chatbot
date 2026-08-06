import { pool } from '../../../lib/db';
import { createSession } from '../../../lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, email, password, otp } = await req.json();

    if (!username || !email || !password || !otp) {
      return Response.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Validate OTP
    const [otpRows] = await pool.query(
      'SELECT * FROM otp_codes WHERE email = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpRows.length === 0) {
      return Response.json(
        { success: false, error: 'Invalid or expired OTP. Please try again.' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await pool.query('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [otpRows[0].id]);

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const newUserId = result.insertId;

    // Auto-login: create session cookie (new users start at 'public' tier)
    await createSession({ userId: newUserId, username, tier: 'public' });


    return Response.json({
      success: true,
      message: 'Account created successfully!',
      username,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    // Handle duplicate username/email
    if (error.code === 'ER_DUP_ENTRY') {
      return Response.json(
        { success: false, error: 'That username or email is already taken.' },
        { status: 409 }
      );
    }
    return Response.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}