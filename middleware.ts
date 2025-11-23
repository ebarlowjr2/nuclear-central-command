import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    // TODO: Replace with real authentication check
    // For now, this is a placeholder that allows all access
    // In production, you should:
    // 1. Check for authentication cookies/tokens
    // 2. Verify user has admin privileges
    // 3. Redirect to login page if not authenticated
    
    // Example of what real auth check might look like:
    // const isLoggedIn = req.cookies.get('auth-token');
    // const isAdmin = req.cookies.get('user-role') === 'admin';
    // if (!isLoggedIn || !isAdmin) {
    //   const loginUrl = new URL("/login", req.url);
    //   return NextResponse.redirect(loginUrl);
    // }
    
    // For now, allow all access to admin routes
    // Remove this comment and implement real auth when ready
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
