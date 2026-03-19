import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MANAGER_PREFIXES = ["/manager", "/inbox", "/reviews", "/schedule", "/settings", "/system"];
const STUDIO_PREFIXES = ["/studio/teacher"];
const PUBLIC_PATHS = new Set([
  "/",
  "/contribuir",
  "/contribuir/obrigado",
  "/landing",
  "/ops/login",
  "/ops/unauthorized",
  "/studio/login",
  "/studio/unauthorized",
]);

function isProtectedPath(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function buildRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const originalPath =
    request.nextUrl.pathname + (request.nextUrl.search ? request.nextUrl.search : "");
  if (originalPath && originalPath !== pathname) {
    url.searchParams.set("next", originalPath);
  }
  return url;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && (pathname === "/ops/login" || pathname === "/studio/login")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname === "/ops/login" ? "/manager" : "/studio/teacher";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtectedPath(pathname, MANAGER_PREFIXES) && !user) {
    return NextResponse.redirect(buildRedirect(request, "/ops/login"));
  }

  if (isProtectedPath(pathname, STUDIO_PREFIXES) && !user) {
    return NextResponse.redirect(buildRedirect(request, "/studio/login"));
  }

  if (!PUBLIC_PATHS.has(pathname) && !isProtectedPath(pathname, MANAGER_PREFIXES) && !isProtectedPath(pathname, STUDIO_PREFIXES)) {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
