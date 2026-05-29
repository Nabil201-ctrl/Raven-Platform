import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Simple API-key based auth guard.
 * Expects header: x-api-key matching the configured RAVEN_API_KEY env var.
 * Falls through in development mode (when RAVEN_API_KEY is unset) for sandbox convenience.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const apiKey = process.env.RAVEN_API_KEY;
    // In dev/sandbox with no key configured, allow all requests through
    if (!apiKey) return true;

    const request = context.switchToHttp().getRequest();
    const headerKey = request.headers['x-api-key'];
    if (headerKey === apiKey) return true;

    throw new UnauthorizedException('Invalid or missing API key');
  }
}

/**
 * Admin guard — requires x-admin-key header matching RAVEN_ADMIN_KEY env var.
 * Used for destructive admin operations (reset seats, resolve complaints, shuttle management).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const adminKey = process.env.RAVEN_ADMIN_KEY;
    // In dev/sandbox with no key configured, allow all requests through
    if (!adminKey) return true;

    const request = context.switchToHttp().getRequest();
    const headerKey = request.headers['x-admin-key'];
    if (headerKey === adminKey) return true;

    throw new UnauthorizedException('Admin access required');
  }
}
