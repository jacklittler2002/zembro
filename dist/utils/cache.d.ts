import NodeCache from "node-cache";
export declare const cache: NodeCache;
export declare function cacheMiddleware(keyFn: (req: any) => string, ttl?: number): (req: any, res: any, next: any) => any;
//# sourceMappingURL=cache.d.ts.map