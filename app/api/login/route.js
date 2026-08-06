import { pool } from '../../../lib/db';
import { createSession } from '../../../lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return Response.json(
        { success: false, error: 'Username/email and password are required.' },
        { status: 400 }
      );
    }

    // Look up by username OR email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return Response.json(
        { success: false, error: 'No account found with that username or email.' },
        { status: 404 }
      );
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return Response.json(
        { success: false, error: 'Incorrect password.' },
        { status: 401 }
      );
    }

    // Create session cookie (include tier for context control)
    await createSession({ userId: user.id, username: user.username, tier: user.tier || 'public' });


    return Response.json({
      success: true,
      message: 'Login successful',
      username: user.username,
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}