import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type OpenRouterKeyRecord = {
  id: number;
  name: string;
  keyValue: string;
  source: "env" | "supabase";
};

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function getExistingEnvOpenRouterKeys(): OpenRouterKeyRecord[] {
  return Array.from({ length: 3 }, (_, index) => {
    const name = `OPENROUTER_API_KEY_${index + 1}`;
    const keyValue = env(name).trim();

    if (!keyValue) return null;

    return {
      id: 0,
      name,
      keyValue,
      source: "env" as const,
    };
  }).filter(Boolean) as OpenRouterKeyRecord[];
}

async function getSupabaseBackupKeys(): Promise<OpenRouterKeyRecord[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("openrouter_backup_keys")
    .select("id, name, key_value")
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("id", { ascending: true })
    .limit(10);

  if (error) {
    return [];
  }

  return (data || []).map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    keyValue: String(row.key_value),
    source: "supabase" as const,
  }));
}

export async function getOpenRouterKeysWithBackups() {
  const envKeys = getExistingEnvOpenRouterKeys();
  const backupKeys = await getSupabaseBackupKeys();

  return [...envKeys, ...backupKeys];
}

export async function markOpenRouterBackupKeyUsed(key: OpenRouterKeyRecord) {
  if (key.source !== "supabase" || !key.id) return;

  const supabase = createSupabaseAdminClient();

  if (!supabase) return;

  try {
    await supabase
      .from("openrouter_backup_keys")
      .update({
        last_used_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", key.id);
  } catch {
    // Do not fail generation because usage logging failed.
  }
}

export async function markOpenRouterBackupKeyError(
  key: OpenRouterKeyRecord,
  error: string
) {
  if (key.source !== "supabase" || !key.id) return;

  const supabase = createSupabaseAdminClient();

  if (!supabase) return;

  try {
    await supabase
      .from("openrouter_backup_keys")
      .update({
        last_error: error.slice(0, 700),
      })
      .eq("id", key.id);
  } catch {
    // Do not fail generation because error logging failed.
  }
}