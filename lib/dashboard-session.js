import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);
const COOKIE_NAME = 'dashboard_session';
// Bump this version whenever credentials change to invalidate all prior dashboard JWTs.
const SESSION_VERSION = 2;

export async function createDashboardSession(payload) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ ...payload, v: SESSION_VERSION })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(encodedKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getDashboardSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });

    if (payload?.username !== 'test' || payload?.v !== SESSION_VERSION) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function deleteDashboardSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}