import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Production-Grade HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://sandbox.monnify.com'],
        },
      },
    }),
  );

  // 2. Gzip/Deflate Payload Compression
  app.use(compression());

  // 3. Trust Reverse Proxy (Cloudflare, Nginx, Load Balancers)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // 4. Global DTO Validation Pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,        // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert string→number etc.
      },
    }),
  );

  // 5. Global Exception Filter — sanitized error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 6. Global Logging Interceptor — structured request audit trail
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 7. Graceful Shutdown Hooks — flush DB and disconnect sockets on SIGTERM
  app.enableShutdownHooks();

  // 8. Flexible & Production-Ready CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : true, // fallback to true/wildcard for sandbox/development flexibility
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, x-api-key, x-admin-key',
  });

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  
  // Startup environment validation warnings
  const warnings: string[] = [];
  if (!process.env.APIKEY) warnings.push('APIKEY (Monnify)');
  if (!process.env.Secret_Key) warnings.push('Secret_Key (Monnify)');
  if (!process.env.Contract_Code) warnings.push('Contract_Code (Monnify)');
  if (!process.env.AT_API_KEY) warnings.push('AT_API_KEY (Africa\'s Talking)');
  if (!process.env.AT_USERNAME) warnings.push('AT_USERNAME (Africa\'s Talking)');

  logger.log(`=============================================================`);
  logger.log(` Raven Backend is running on port ${port}`);
  logger.log(`  Security Headers (Helmet): ENABLED`);
  logger.log(` Payload Compression (Gzip): ENABLED`);
  logger.log(` Input Validation (ValidationPipe): ENABLED`);
  logger.log(` Exception Filter: ENABLED`);
  logger.log(` Request Logging: ENABLED`);
  logger.log(` Trusted Proxies: ENABLED`);
  logger.log(`  Graceful Shutdown Hooks: ENABLED`);
  if (warnings.length > 0) {
    logger.warn(`  Missing env vars (sandbox mode): ${warnings.join(', ')}`);
  }
  logger.log(`=============================================================`);
}
bootstrap();
