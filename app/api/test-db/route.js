import { pool } from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    return Response.json({ success: true, result: rows[0].result });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}