import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('JWT_SECRET is missing. Set it in the production environment.');
}
const encodedKey = new TextEncoder().encode(secretKey);

/**
 * Signs a JWT with the given payload, expires in 7 days.
 */
export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

/**
 * Verifies and decodes a JWT. Returns null if invalid/expired.
 */
export async function decrypt(token) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Creates a session cookie after login/signup.
 * @param {{ userId: number, username: string }} sessionData
 */
export async function createSession(sessionData) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ ...sessionData, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Reads and verifies the current session from cookies.
 * Returns the payload or null if not authenticated.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await decrypt(token);
}

/**
 * Deletes the session cookie (logout).
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
