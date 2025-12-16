type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  // later: structure this better or send to a proper logger
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
}

export const logger = {
  info: (...args: unknown[]) => log("info", ...args),
  warn: (...args: unknown[]) => log("warn", ...args),
  error: (...args: unknown[]) => log("error", ...args),
};
