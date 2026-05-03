import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'visitor_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function middleware(req: NextRequest) {
  const existing = req.cookies.get(COOKIE_NAME);
  if (existing) return NextResponse.next();

  const visitorId = crypto.randomUUID();
  const res = NextResponse.next();
  res.cookies.set(COOKIE_NAME, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR_SECONDS,
    path: '/',
  });
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/internal).*)'],
};
