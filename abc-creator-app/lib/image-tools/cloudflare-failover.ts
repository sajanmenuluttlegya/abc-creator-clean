export function isCloudflareKeyExhausted(message: string, status = 0) {
  const text = `${message || ""} ${status}`.toLowerCase();

  return status === 429 ||
    /daily\s+free\s+allocation|used\s+up.*allocation|10,?000\s+neurons|workers\s+paid\s+plan|quota\s+exceeded|rate\s*limit|too\s+many\s+requests|temporarily\s+unavailable|capacity|overloaded|busy/i.test(text);
}

export function shouldRotateCloudflareCredential(status: number, message = "", providerRefused = false) {
  if (providerRefused) return false;
  if (isCloudflareKeyExhausted(message, status)) return true;
  return status === 0 || status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export const ALL_CLOUDFLARE_KEYS_EXHAUSTED_MESSAGE =
  "All active Cloudflare AI keys have reached their daily allocation or are temporarily busy. The system tried the available keys, but none had capacity left. Add more active keys, wait for Cloudflare's daily reset, or upgrade the exhausted Cloudflare accounts.";
