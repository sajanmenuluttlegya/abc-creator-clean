import { createServiceRoleClient } from "@/lib/supabase/service";
import { MAX_CLOUDFLARE_AI_CREDENTIALS } from "./image-models";

export type CloudflareAICredential = {
  id: string;
  key_slot: number;
  label: string;
  account_id: string;
  api_token: string;
  timeout_ms: number;
};

export async function getActiveCloudflareAICredentials() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("cloudflare_ai_credentials")
    .select("id,key_slot,label,account_id,api_token,timeout_ms")
    .eq("provider", "cloudflare-workers-ai")
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("key_slot", { ascending: true })
    .limit(MAX_CLOUDFLARE_AI_CREDENTIALS);

  if (error) {
    throw new Error(`Could not load Cloudflare AI credentials: ${error.message}`);
  }

  return (data || []) as CloudflareAICredential[];
}