import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { DEMO_COOKIE, verifyDemoSession } from "@/lib/demo-session";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

const protectedPrefixes = ["/account", "/admin", "/checkout"];

function isProtected(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

function hasSupabaseSession(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes authenticate inside their handlers.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const protectedRoute = isProtected(pathname);

  if (isSupabaseConfigured()) {
    const hasSession = hasSupabaseSession(request);

    // Public pages should not pay for an auth round trip when the visitor is
    // anonymous. Protected pages can redirect without calling Supabase too.
    if (!protectedRoute && !hasSession) return NextResponse.next();
    if (protectedRoute && !hasSession) return redirectToLogin(request);

    let response = NextResponse.next({ request });
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      user = null;
    }

    if (protectedRoute && !user) return redirectToLogin(request);

    return response;
  }

  if (protectedRoute) {
    const payload = await verifyDemoSession(request.cookies.get(DEMO_COOKIE)?.value);
    if (!payload) return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|robots.txt|sitemap.xml|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
