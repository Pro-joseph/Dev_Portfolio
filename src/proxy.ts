import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALES, geoDefaultLocale } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";
  if (LOCALES.includes(first as (typeof LOCALES)[number])) {
    const res = NextResponse.next();
    res.cookies.set("locale", first, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  }

  if (pathname.includes(".")) return NextResponse.next();

  const url = request.nextUrl.clone();
  const defaultLocale = geoDefaultLocale(
    request.headers.get("x-vercel-ip-country")
  );
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
