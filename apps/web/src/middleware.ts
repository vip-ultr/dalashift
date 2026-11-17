import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route protection.
 *
 * The signed-in area is behind the `dalashift_session` cookie. The check here
 * is a fast redirect so a signed-out visitor never renders a private shell.
 * The real verification happens on the server, where the session is looked up
 * in the database and the account id is read from there, never from the
 * request.
 */

const SESSION_COOKIE_NAME = 'dalashift_session';

const PROTECTED_PREFIXES = ['/dashboard', '/profile'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    // /register?new=true is a link from an in-app "add another farmer" flow
    // while a session is still active, so let it through to the registration
    // screen. This is NOT a sign-out: sign-out only happens through a POST to
    // /api/auth/logout, which revokes the server session. Never delete the
    // cookie here, since that would leave the server session valid.
    if (request.nextUrl.searchParams.has('new')) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|ico|webmanifest)$).*)',
  ],
};
