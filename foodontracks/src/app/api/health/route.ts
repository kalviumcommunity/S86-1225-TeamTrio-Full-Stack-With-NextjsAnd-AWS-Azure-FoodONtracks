import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Basic health check
    const healthcheck = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "1.0.0",
    };

    return NextResponse.json(healthcheck, { status: 200 });
  } catch (error) {
    const errorResponse = {
      status: "error",
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Unknown error",
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}
