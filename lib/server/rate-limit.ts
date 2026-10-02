import { createHash, createHmac } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_SECONDS = 60;
const RATE_LIMIT_PREFIX = "rufact:analyze";

interface MemoryWindow {
  count: number;
  reset: number;
}

export interface AnalysisRateLimit {
  allowed: boolean;
  configured: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const memoryWindows = new Map<string, MemoryWindow>();
let distributedLimiter: Ratelimit | null = null;

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function rateLimitSettings() {
  return {
    limit: positiveInteger(process.env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_LIMIT),
    windowSeconds: positiveInteger(
      process.env.RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_WINDOW_SECONDS,
    ),
  };
}

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "local";
}

function identifierFor(request: Request) {
  const address = clientAddress(request);
  const secret = process.env.RATE_LIMIT_HASH_SECRET?.trim();

  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    return null;
  }

  return secret
    ? createHmac("sha256", secret).update(address, "utf8").digest("hex")
    : createHash("sha256").update(address, "utf8").digest("hex");
}

export function consumeMemoryLimit(
  identifier: string,
  now: number,
  limit: number,
  windowSeconds: number,
): AnalysisRateLimit {
  const existing = memoryWindows.get(identifier);
  const window =
    existing && existing.reset > now
      ? existing
      : { count: 0, reset: now + windowSeconds * 1_000 };
  window.count += 1;
  memoryWindows.set(identifier, window);

  if (memoryWindows.size > 2_000) {
    for (const [key, value] of memoryWindows) {
      if (value.reset <= now) memoryWindows.delete(key);
    }
  }

  return {
    allowed: window.count <= limit,
    configured: true,
    limit,
    remaining: Math.max(0, limit - window.count),
    reset: window.reset,
  };
}

function getDistributedLimiter(limit: number, windowSeconds: number) {
  if (distributedLimiter) return distributedLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  distributedLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: RATE_LIMIT_PREFIX,
    analytics: false,
    timeout: 1_500,
  });
  return distributedLimiter;
}

export async function rateLimitAnalysisRequest(
  request: Request,
): Promise<AnalysisRateLimit> {
  const { limit, windowSeconds } = rateLimitSettings();
  const identifier = identifierFor(request);
  if (!identifier) {
    return { allowed: false, configured: false, limit, remaining: 0, reset: 0 };
  }

  const limiter = getDistributedLimiter(limit, windowSeconds);
  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      if (result.reason === "timeout") {
        return { allowed: false, configured: false, limit, remaining: 0, reset: 0 };
      }
      return {
        allowed: result.success,
        configured: true,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch {
      return { allowed: false, configured: false, limit, remaining: 0, reset: 0 };
    }
  }

  if (process.env.NODE_ENV === "production") {
    return { allowed: false, configured: false, limit, remaining: 0, reset: 0 };
  }

  return consumeMemoryLimit(identifier, Date.now(), limit, windowSeconds);
}

export function rateLimitHeaders(result: AnalysisRateLimit) {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
  };
  if (result.reset > 0) {
    headers["RateLimit-Reset"] = String(Math.ceil(result.reset / 1_000));
  }
  return headers;
}

