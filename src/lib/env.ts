const requiredClientEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

export function getClientEnv() {
  if (!requiredClientEnv.supabaseUrl || !requiredClientEnv.supabaseAnonKey) {
    throw new Error("Missing required public environment variables.");
  }

  return requiredClientEnv as {
    supabaseUrl: string;
    supabaseAnonKey: string;
  };
}

export function getServiceRoleKey() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
