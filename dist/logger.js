"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function log(level, ...args) {
    const timestamp = new Date().toISOString();
    // later: structure this better or send to a proper logger
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
}
exports.logger = {
    info: (...args) => log("info", ...args),
    warn: (...args) => log("warn", ...args),
    error: (...args) => log("error", ...args),
};
//# sourceMappingURL=logger.js.map