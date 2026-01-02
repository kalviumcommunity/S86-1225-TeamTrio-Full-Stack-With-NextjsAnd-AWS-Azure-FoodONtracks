import Redis from "ioredis";
import { logger } from "@/app/lib/logger";

const redis = new Redis(process.env.REDIS_URL as string);

redis.on("connect", () => {
  logger.info("app_redis_connected", {});
});

redis.on("error", (err) => {
  logger.error("app_redis_error", { error: String(err) });
});

export default redis;
