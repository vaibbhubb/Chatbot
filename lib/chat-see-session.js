import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);
const COOKIE_NAME = 'chat_see_session';

export async function createChatSeeSession(payload) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const token = await new SignJWT(payload)
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

export async function getChatSeeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });

    if (payload?.username !== 'test') return null;

    return payload;
  } catch {
    return null;
  }
}

export async function deleteChatSeeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}