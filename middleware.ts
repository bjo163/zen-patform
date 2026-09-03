import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "zen-patform.vercel.app";
  const hostname = host.replace(".localhost:3000", `.${rootDomain}`);
  const searchParams = url.searchParams.toString();
  const path = `${url.pathname}${searchParams ? `?${searchParams}` : ""}`;

  // Authentication endpoints and the public login page must never be treated
  // as tenant custom-domain routes. This also makes login resilient when the
  // root-domain environment variable is not configured in Vercel yet.
  if (url.pathname === "/login" || url.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const isVercelProjectHost =
    hostname === "zen-patform.vercel.app" ||
    hostname === "zen-patform-bjo163s-projects.vercel.app" ||
    hostname === "zen-patform-git-main-bjo163s-projects.vercel.app" ||
    (hostname.startsWith("zen-patform-") &&
      hostname.endsWith("-bjo163s-projects.vercel.app"));

  // The Vercel project domain owns the public application routes.
  if (isVercelProjectHost || hostname === rootDomain) {
    return NextResponse.next();
  }

  if (hostname === `app.${rootDomain}`) {
    const session = await getToken({ req });
    if (!session && path !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session && path === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.rewrite(new URL(`/app${path === "/" ? "" : path}`, req.url));
  }

  if (hostname === "localhost:3000") {
    return NextResponse.rewrite(new URL(`/home${path === "/" ? "" : path}`, req.url));
  }

  return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
}
