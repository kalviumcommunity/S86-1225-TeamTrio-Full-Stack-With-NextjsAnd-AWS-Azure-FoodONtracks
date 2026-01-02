import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import withLogging from "@/lib/requestLogger";

export const GET = withLogging(async () => {
  await redis.set("test-key", "Redis Connected!");
  const value = await redis.get("test-key");

  return NextResponse.json({
    success: true,
    message: value,
  });
});
