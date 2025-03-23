import { LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  const app = await NestFactory.create(AppModule, { logger });

  // Set config.
  const configService: ConfigService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const port = configService.get('PORT');
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

// Export for Vercel
export default bootstrap;
