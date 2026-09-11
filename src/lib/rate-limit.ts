import { redis } from "./redis";
import { logger } from "./logger";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Basic fixed-window rate limiter using Redis.
 * @param key The unique identifier for the rate limit (e.g. "rl:login:192.168.1.1")
 * @param limit Maximum number of requests allowed in the window
 * @param windowSeconds Duration of the window in seconds
 * @returns RateLimitResult
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  options: { failClosed?: boolean } = {},
): Promise<RateLimitResult> {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(currentTimestamp / windowSeconds)}`;

  try {
    // Atomically increment and set expiry if it's the first time
    const multi = redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, windowSeconds * 2); // Expiry slightly longer to be safe
    
    const results = await multi.exec();
    
    if (!results || results.length === 0) {
      return {
        success: !options.failClosed,
        limit,
        remaining: options.failClosed ? 0 : limit,
        reset: currentTimestamp + windowSeconds,
      };
    }

    const currentCount = results[0][1] as number;
    const remaining = Math.max(0, limit - currentCount);
    const success = currentCount <= limit;
    
    // Calculate reset time (approximate end of current window)
    const reset = Math.floor(currentTimestamp / windowSeconds) * windowSeconds + windowSeconds;

    return { success, limit, remaining, reset };
  } catch (error) {
    logger.error("rate_limit.redis_error", { key, error });
    // If Redis fails, allow the request so the app stays up.
    return {
      success: !options.failClosed,
      limit,
      remaining: options.failClosed ? 0 : limit,
      reset: currentTimestamp + windowSeconds,
    };
  }
}
