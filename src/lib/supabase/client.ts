import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project-ref") &&
      !supabaseAnonKey.includes("...")
  );
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  return browserClient;
}

export function getPublicStorageUrl(filePath: string): string {
  if (!supabaseUrl) return filePath;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "academic-pdfs";
  const cleanUrl = supabaseUrl.replace(/\/$/, "");
  const cleanPath = filePath.replace(/^\//, "");
  return `${cleanUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
