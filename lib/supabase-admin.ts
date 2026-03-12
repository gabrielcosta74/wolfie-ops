import { createClient } from "@supabase/supabase-js";
import { getOpsEnv } from "@/lib/env";

export function getSupabaseAdmin() {
  const env = getOpsEnv();

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
