import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env";

type SupabaseCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

const protectedPrefixes = ["/dashboard", "/learn", "/upload", "/settings"];
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function updateSession(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getClientEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && authRoutes.includes(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_suspended,onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile && !profile.is_suspended) {
      return NextResponse.redirect(new URL(profile.onboarding_completed ? "/dashboard" : "/onboarding", request.url));
    }
  }

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_suspended,onboarding_completed")
      .eq("id", user.id)
      .single();

    if (!profile || profile.is_suspended) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?suspended=1", request.url));
    }

    if (!profile.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}
