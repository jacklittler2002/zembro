"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
exports.cacheMiddleware = cacheMiddleware;
const node_cache_1 = __importDefault(require("node-cache"));
// Default: 5 min TTL, check every 10 min
exports.cache = new node_cache_1.default({ stdTTL: 300, checkperiod: 600 });
function cacheMiddleware(keyFn, ttl = 300) {
    return (req, res, next) => {
        const key = keyFn(req);
        const cached = exports.cache.get(key);
        if (cached) {
            return res.json(cached);
        }
        // Monkey-patch res.json to cache the result
        const origJson = res.json.bind(res);
        res.json = (body) => {
            exports.cache.set(key, body, ttl);
            return origJson(body);
        };
        next();
    };
}
//# sourceMappingURL=cache.js.map