import "server-only";

/**
 * Best-effort, per-instance sliding window. Good enough to stop accidental
 * hammering; pair with a Vercel Firewall rate-limit rule in production.
 */
const hits = new Map<string, number[]>();

export function limited(req: Request, bucket: string, max: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) return true;
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}
