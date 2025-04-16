import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const cookieParser = require('cookie-parser');

import { LogLevel, ValidationPipe } from "@nestjs/common";
import 'dotenv/config';

async function bootstrap() {
	const logger: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
	const app = await NestFactory.create(AppModule, { logger });
	const configService: ConfigService = app.get(ConfigService);

	// Set config
	const isDisableCors = configService.get('ENABLE_CORS') === 'false';
	if (!isDisableCors) {
		app.enableCors({
			origin: configService.get('FRONTEND_URL'),
			credentials: true,
		});
		console.log('CORS enabled!')
	}

	app.use(cookieParser());
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
		}),
	);
	const port = configService.get('PORT');
	await app.listen(port);
	console.log(`Application is running on: ${await app.getUrl()}`)
}
bootstrap();
