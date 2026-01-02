import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Middleware to automatically log API requests with timing and status
 * Attach correlation IDs to requests for distributed tracing
 */
export function loggingMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    // Generate or extract request ID for correlation
    const requestId =
      (req.headers.get('x-request-id') as string) ||
      logger.generateRequestId();

    // Add request ID to response headers for client tracking
    const startTime = Date.now();
    let statusCode = 500;
    let error: Error | undefined;

    try {
      // Call the actual handler
      const response = await handler(req);
      statusCode = response.status;

      // Clone response to add headers
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });

      // Add correlation ID and timing headers
      newResponse.headers.set('x-request-id', requestId);
      newResponse.headers.set('x-response-time', `${Date.now() - startTime}ms`);

      return newResponse;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      statusCode = 500;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const method = req.method;
      const endpoint = req.nextUrl.pathname;
      const userId = (context?.user?.id as string | number) || undefined;

      // Log the request
      logger.logRequest(requestId, method, endpoint, statusCode, duration, userId, error);
    }
  };
}

/**
 * Extract request context for logging from Next.js request
 */
export function extractRequestContext(req: NextRequest) {
  return {
    requestId: req.headers.get('x-request-id') || logger.generateRequestId(),
    endpoint: req.nextUrl.pathname,
    method: req.method,
    userAgent: req.headers.get('user-agent'),
    ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
    referer: req.headers.get('referer'),
  };
}
