import { pool } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    return Response.json({ success: true, message: 'Login successful', username: user.username });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}