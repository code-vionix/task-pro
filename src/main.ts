import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // Only show errors and warnings from Nest itself
  });
  app.enableCors({
    origin: [
      'https://taskpro.codevionix.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  }); // Enable CORS for the frontend
  app.setGlobalPrefix('api'); // Add /api prefix to all routes
  const port = process.env.PORT ?? 5000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
