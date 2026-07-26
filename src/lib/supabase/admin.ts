import { createClient } from "@supabase/supabase-js";
import { getClientEnv, getServiceRoleKey } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { supabaseUrl } = getClientEnv();
  return createClient(supabaseUrl, getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
