import NodeCache from "node-cache";

// Default: 5 min TTL, check every 10 min
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

export function cacheMiddleware(keyFn: (req: any) => string, ttl = 300) {
  return (req: any, res: any, next: any) => {
    const key = keyFn(req);
    const cached = cache.get(key);
    if (cached) {
      return res.json(cached);
    }
    // Monkey-patch res.json to cache the result
    const origJson = res.json.bind(res);
    res.json = (body: any) => {
      cache.set(key, body, ttl);
      return origJson(body);
    };
    next();
  };
}
