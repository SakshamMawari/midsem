import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function isSupabaseServerConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      (supabaseServiceRoleKey || supabaseAnonKey) &&
      !supabaseUrl.includes("your-project-ref")
  );
}

/**
 * Standard server client using anon key
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project-ref")) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Privileged admin server client using service_role key
 * NEVER import or execute in client components
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!supabaseUrl || !key || supabaseUrl.includes("your-project-ref")) {
    return null;
  }
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
