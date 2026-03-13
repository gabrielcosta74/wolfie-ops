import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Wolfie Ops"',
    },
  });
}

export function middleware(req: NextRequest) {
  // Public and teacher portals — bypass admin basic auth
  const publicPrefixes = ["/manager/content/academy", "/contribuir", "/studio"];
  const isPublicPath = req.nextUrl.pathname === "/" || publicPrefixes.some((p) => req.nextUrl.pathname.startsWith(p));
  
  if (isPublicPath) {
    return NextResponse.next();
  }

  const expectedUser = process.env.OPS_BASIC_AUTH_USER;
  const expectedPassword = process.env.OPS_BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return NextResponse.next();
  }

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const decoded = atob(header.slice(6));
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 0) {
    return unauthorizedResponse();
  }

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (user !== expectedUser || password !== expectedPassword) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
