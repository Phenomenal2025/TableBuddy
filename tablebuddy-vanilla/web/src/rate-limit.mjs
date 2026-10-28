// Requests are counted over the preceding window, keyed by the direct peer IP.
// Forwarded headers are deliberately not trusted by this local server.
export function createRateLimiter({limit = 30, windowMs = 60000, now = Date.now} = {}) {
  const buckets = new Map();
  function prune(at = now()) {
    for (const [key, requests] of buckets) {
      const recent = requests.filter(time => time > at - windowMs);
      if (recent.length) buckets.set(key, recent);
      else buckets.delete(key);
    }
  }
  const timer = setInterval(prune, windowMs);
  timer.unref();
  return {
    take(key) {
      const at = now();
      const recent = (buckets.get(key) || []).filter(time => time > at - windowMs);
      if (recent.length >= limit) return {allowed: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - at) / 1000))};
      recent.push(at);
      buckets.set(key, recent);
      return {allowed: true};
    },
    prune,
    get size() { return buckets.size; },
    dispose() { clearInterval(timer); buckets.clear(); },
  };
}
