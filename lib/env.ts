function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }

  return value;
}

export function getOpsEnv() {
  return {
    supabaseUrl: requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    agentOpsSharedSecret: requiredEnv("AGENT_OPS_SHARED_SECRET"),
  };
}
