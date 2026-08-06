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
    let users;
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
        [identifier, identifier]
      );
      users = rows;
    } catch (dbError) {
      console.error('Login DB lookup error:', dbError);
      return Response.json(
        { success: false, error: 'Database lookup failed. Check the production DB connection.' },
        { status: 500 }
      );
    }

    if (users.length === 0) {
      return Response.json(
        { success: false, error: 'No account found with that username or email.' },
        { status: 404 }
      );
    }

    const user = users[0];
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch (compareError) {
      console.error('Login password compare error:', compareError);
      return Response.json(
        { success: false, error: 'Password verification failed. Check the stored password hash.' },
        { status: 500 }
      );
    }

    if (!isMatch) {
      return Response.json(
        { success: false, error: 'Incorrect password.' },
        { status: 401 }
      );
    }

    // Create session cookie
    try {
      await createSession({ userId: user.id, username: user.username });
    } catch (sessionError) {
      console.error('Login session creation error:', sessionError);
      return Response.json(
        { success: false, error: 'Session creation failed. Check JWT_SECRET and cookie settings in production.' },
        { status: 500 }
      );
    }


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