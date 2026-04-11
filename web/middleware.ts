import { NextRequest, NextResponse } from 'next/server';

// Routes that require the native app — redirect web visitors to /download
const GATED_PREFIXES = [
  '/ad/',
  '/seller/',
  '/reviews/',
  '/post/',
  '/chat/',
  '/profile/',
  '/settings',
  '/my-ads',
  '/favorites',
  '/premium/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /favorites and /settings are exact paths, others are prefixes
  const isGated = GATED_PREFIXES.some((p) =>
    p.endsWith('/') ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + '/')
  );

  if (isGated) {
    const url = request.nextUrl.clone();
    url.pathname = '/download';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images).*)'],
};
