import { NextRequest, NextResponse } from "next/server";
import { logger, genRequestId } from "./logger";

export type ApiHandler = (...args: any[]) => Promise<any>;

export function withLogging(handler: ApiHandler): ApiHandler {
  return async (...args: any[]) => {
    const req = args[0] as NextRequest;
    const requestId = genRequestId();
    const start = Date.now();

    logger.info("api_request_received", {
      requestId,
      method: req?.method,
      url: req?.url,
      pathname: req?.nextUrl?.pathname,
    });

    try {
      const res = await handler(...args);

      const duration = Date.now() - start;
      logger.info("api_request_completed", {
        requestId,
        status: res?.status ?? 200,
        durationMs: duration,
        method: req?.method,
        pathname: req?.nextUrl?.pathname,
      });

      return res;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error("api_request_error", {
        requestId,
        error: String(error),
        durationMs: duration,
        method: req?.method,
        pathname: req?.nextUrl?.pathname,
      });

      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}

export default withLogging;
