import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "zen-patform.vercel.app";
  const deploymentSuffix = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX;

  let hostname = req.headers.get("host") || "";
  hostname = hostname.replace(".localhost:3000", `.${rootDomain}`);

  if (
    deploymentSuffix &&
    hostname.includes("---") &&
    hostname.endsWith(`.${deploymentSuffix}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${rootDomain}`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  if (hostname === `app.${rootDomain}`) {
    const session = await getToken({ req });
    if (!session && path !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    } else if (session && path === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.rewrite(
      new URL(`/app${path === "/" ? "" : path}`, req.url),
    );
  }

  if (
    hostname === "localhost:3000" ||
    hostname === rootDomain ||
    hostname === "zen-patform.vercel.app"
  ) {
    return NextResponse.rewrite(
      new URL(`/home${path === "/" ? "" : path}`, req.url),
    );
  }

  return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
}
