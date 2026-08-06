import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

// Routes that require authentication
const protectedRoutes = ['/chat'];
const publicChatRoutes = ['/chat/see'];
// Routes that redirect to /chat when already logged in
const authRoutes = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session')?.value;
  const session = sessionToken ? await decrypt(sessionToken) : null;
  const isLoggedIn = !!session;

  if (publicChatRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Unauthenticated access to protected route → redirect to /login
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Already logged in visiting login/signup → redirect to /chat
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
