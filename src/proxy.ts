import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/register"];
const publicApiPrefixes = ["/api/service-areas", "/api/plans", "/api/offers"];
const protectedAppPaths = ["/customer", "/crm", "/installation", "/activation"];

async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  // Allow public API routes (service-areas, plans, offers)
  if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Get token from cookie OR Authorization header (Bearer token)
  const cookieToken = request.cookies.get("token")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;

  // Protect app routes (/customer, /crm, /installation, /activation)
  if (protectedAppPaths.some((path) => pathname.startsWith(path))) {
    if (!token || !(await verifyTokenEdge(token))) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Protect all other /api/* routes
  if (pathname.startsWith("/api")) {
    if (!token || !(await verifyTokenEdge(token))) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/crm/:path*",
    "/installation/:path*",
    "/activation/:path*",
    "/api/:path*",
  ],
};
