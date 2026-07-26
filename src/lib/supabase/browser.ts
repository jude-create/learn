"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getClientEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
