import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * Redirect anonymous visitors away from the authenticated pages.
 * Server actions and pages still re-check auth themselves; this is UX, not the security boundary.
 */
export async function proxy(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/quiz/:path*", "/attempt/:path*", "/me"],
};
