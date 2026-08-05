import { pool } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, email, password, otp } = await req.json();

    const [otpRows] = await pool.query(
      'SELECT * FROM otp_codes WHERE email = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpRows.length === 0) {
      return Response.json({ success: false, error: 'Invalid or expired OTP.' }, { status: 400 });
    }

    await pool.query('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [otpRows[0].id]);

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    return Response.json({ success: true, message: 'Account created successfully!' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}