import { Redis } from "ioredis";
import { logger } from "./logger";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  throw new Error("REDIS_URL is not defined");
};

const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      return null; // Stop retrying
    }
    return Math.min(times * 100, 3000); // Exponential backoff
  },
});

redis.on("error", (error) => {
  logger.error("redis_connection_error", { error: String(error) });
});

redis.on("connect", () => {
  logger.info("redis_connected", {});
});

export default redis;
