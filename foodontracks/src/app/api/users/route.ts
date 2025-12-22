import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";

export async function GET() {
  const cacheKey = "users:list";

  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("⚡ Cache Hit");
    return NextResponse.json(JSON.parse(cached));
  }

  console.log("🐢 Cache Miss");
  const users = await prisma.user.findMany();

  await redis.set(cacheKey, JSON.stringify(users), "EX", 60);

  return NextResponse.json(users);
}
