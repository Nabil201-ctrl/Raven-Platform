import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - start;
        this.logger.log(
          `${method} ${url} → ${res.statusCode} (${duration}ms)`,
        );
        // Log mutation payloads at debug level (sanitized — no sensitive wallet details)
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && body) {
          const sanitized = { ...body };
          delete sanitized.password;
          delete sanitized.token;
          this.logger.debug(`  Body: ${JSON.stringify(sanitized).substring(0, 300)}`);
        }
      }),
    );
  }
}
