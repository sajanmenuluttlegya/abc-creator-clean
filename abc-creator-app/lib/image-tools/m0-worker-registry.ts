import { createServiceRoleClient } from "@/lib/supabase/service";

export type M0WorkerRegistrationInput = {
  workerName: string;
  publicUrl: string;
  slotStartIST: string;
  slotStopIST: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
};

export type ActiveM0Worker = {
  workerName: string;
  publicUrl: string;
  expiresAt: string;
};

type WorkerHealth = {
  ok?: boolean;
  worker?: string;
  accepting_jobs?: boolean;
};

type WorkerRegistryRow = {
  worker_name: string | null;
  public_url: string | null;
  expires_at: string | null;
};

const BUILT_IN_ALLOWED_WORKERS = [
  "m0-cinefax",
  "m0-steverichards77",
  "m0-ashstizhard",
  "m0-dpstards",
  "m0-iitmania",
  "m0-assskr",
] as const;
const DEFAULT_ALLOWED_TUNNEL_SUFFIXES = ".trycloudflare.com";
const MAX_REGISTRATION_LIFETIME_MS = 6 * 60 * 60 * 1000;
const MAX_METADATA_BYTES = 16_000;
const HEALTH_TIMEOUT_MS = 15_000;

function splitEnvironmentList(value: string | undefined, fallback: string) {
  return (value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAllowedWorkers() {
  const configuredWorkers = splitEnvironmentList(
    process.env.M0_ALLOWED_WORKERS,
    ""
  );

  return new Set([...BUILT_IN_ALLOWED_WORKERS, ...configuredWorkers]);
}

function validateWorkerName(workerName: string) {
  if (!getAllowedWorkers().has(workerName)) {
    throw new Error("M0 worker name is not allowed.");
  }
}

function normalizePublicUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("M0 worker URL is invalid.");
  }

  if (url.protocol !== "https:") {
    throw new Error("M0 worker URL must use HTTPS.");
  }

  if (url.username || url.password || url.port) {
    throw new Error(
      "M0 worker URL must not contain credentials or a custom port."
    );
  }

  const hostname = url.hostname.toLowerCase();
  const allowedHostSuffixes = splitEnvironmentList(
    process.env.M0_ALLOWED_TUNNEL_SUFFIXES,
    DEFAULT_ALLOWED_TUNNEL_SUFFIXES
  ).map((item) => item.toLowerCase());

  const hostAllowed = allowedHostSuffixes.some((suffix) => {
    if (suffix.startsWith(".")) {
      return hostname.endsWith(suffix) && hostname.length > suffix.length;
    }

    return hostname === suffix;
  });

  if (!hostAllowed) {
    throw new Error("M0 worker URL host is not allowed.");
  }

  url.pathname = "";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

function validateExpiry(expiresAt: string) {
  const expiryMs = Date.parse(expiresAt);

  if (!Number.isFinite(expiryMs)) {
    throw new Error("Invalid worker expiry timestamp.");
  }

  const now = Date.now();

  if (expiryMs <= now) {
    throw new Error("Worker expiry timestamp is already in the past.");
  }

  if (expiryMs > now + MAX_REGISTRATION_LIFETIME_MS) {
    throw new Error("Worker expiry timestamp is too far in the future.");
  }

  return new Date(expiryMs).toISOString();
}

function validateSlotTime(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error("Invalid worker slot time.");
  }

  return value;
}

function sanitizeMetadata(metadata: Record<string, unknown> | undefined) {
  const safeMetadata = metadata || {};
  const encoded = JSON.stringify(safeMetadata);

  if (Buffer.byteLength(encoded, "utf8") > MAX_METADATA_BYTES) {
    throw new Error("M0 worker metadata is too large.");
  }

  return safeMetadata;
}

async function fetchWorkerHealth(
  publicUrl: string,
  expectedWorkerName: string
) {
  const response = await fetch(`${publicUrl}/health`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `M0 worker health check returned HTTP ${response.status}.`
    );
  }

  const health = (await response.json()) as WorkerHealth;

  if (health.ok !== true) {
    throw new Error("M0 worker health response did not report ok=true.");
  }

  if (health.worker !== expectedWorkerName) {
    throw new Error(
      "M0 worker health response returned the wrong worker name."
    );
  }

  if (health.accepting_jobs !== true) {
    throw new Error("M0 worker is not accepting jobs.");
  }

  return health;
}

export async function registerM0Worker(input: M0WorkerRegistrationInput) {
  const workerName = String(input.workerName || "").trim();
  const slotStartIST = validateSlotTime(
    String(input.slotStartIST || "").trim()
  );
  const slotStopIST = validateSlotTime(
    String(input.slotStopIST || "").trim()
  );

  validateWorkerName(workerName);

  const publicUrl = normalizePublicUrl(
    String(input.publicUrl || "").trim()
  );
  const expiresAt = validateExpiry(String(input.expiresAt || "").trim());
  const metadata = sanitizeMetadata(input.metadata);

  await fetchWorkerHealth(publicUrl, workerName);

  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("m0_worker_registry").upsert(
    {
      worker_name: workerName,
      public_url: publicUrl,
      status: "ready",
      slot_start_ist: slotStartIST,
      slot_stop_ist: slotStopIST,
      registered_at: nowIso,
      expires_at: expiresAt,
      last_health_at: nowIso,
      metadata,
    },
    { onConflict: "worker_name" }
  );

  if (error) {
    throw new Error(
      `Could not save M0 worker registration: ${error.message}`
    );
  }

  return {
    workerName,
    publicUrl,
    expiresAt,
  };
}

export async function getActiveM0Worker(): Promise<ActiveM0Worker | null> {
  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("m0_worker_registry")
    .select("worker_name, public_url, expires_at")
    .eq("status", "ready")
    .gt("expires_at", nowIso)
    .order("registered_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Could not read M0 worker registry: ${error.message}`);
  }

  for (const row of (data || []) as WorkerRegistryRow[]) {
    const workerName = String(row.worker_name || "").trim();
    const expiresAt = String(row.expires_at || "").trim();

    try {
      validateWorkerName(workerName);
      const publicUrl = normalizePublicUrl(
        String(row.public_url || "").trim()
      );

      await fetchWorkerHealth(publicUrl, workerName);

      await supabase
        .from("m0_worker_registry")
        .update({ last_health_at: new Date().toISOString() })
        .eq("worker_name", workerName);

      return {
        workerName,
        publicUrl,
        expiresAt,
      };
    } catch {
      if (workerName) {
        await supabase
          .from("m0_worker_registry")
          .update({ status: "offline" })
          .eq("worker_name", workerName);
      }
    }
  }

  return null;
}
