import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCookieOptions } from "./cookie-options";

const PROTECTED_PAGE_PREFIXES = ["/dashboard", "/tools"];
const PROTECTED_API_PREFIXES = ["/api/generate"];

function isProtectedPath(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  const protectedPage = isProtectedPath(pathname, PROTECTED_PAGE_PREFIXES);
  const protectedApi = isProtectedPath(pathname, PROTECTED_API_PREFIXES);

  if (!protectedPage && !protectedApi) {
    await supabase.auth.getUser();
    return supabaseResponse;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isAuthed = !error && Boolean(user);

  if (!isAuthed && protectedApi) {
    return NextResponse.json(
      { error: "Login required.", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  if (!isAuthed && protectedPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
