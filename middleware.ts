import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Developer routes protection
    if (pathname.startsWith('/developer')) {
      // Require authentication for other developer routes
      if (!token) {
        return NextResponse.redirect(new URL('/login?redirected=true', req.url));
      }
      // Require developer role
      if (token.role !== 'developer') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
    }

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      // Require authentication
      if (!token) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
      // Require admin role
      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/developer/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/login',
          '/forgot-password',
          '/reset-password',
          '/admin/login',
          '/admin/register',
          '/admin/forgot-password',
          '/admin/reset-password',
        ];
        // API routes that should be public
        const publicApiRoutes = [
          '/api/auth',
          '/api/auth/registration-status',
          '/api/webhooks/waha/session-events',
        ];
        // Allow access to public page routes (exact match)
        if (publicRoutes.includes(pathname)) {
          return true;
        }
        // Allow access to public API routes (startsWith)
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }
        // For protected routes, require valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}; 