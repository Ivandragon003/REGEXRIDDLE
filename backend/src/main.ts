import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Tutte le route REST sotto /api
  app.setGlobalPrefix('api');

  // CORS per il frontend in sviluppo
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Validazione automatica dei DTO
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Risposte di errore in formato { error, status }
  app.useGlobalFilters(new AllExceptionsFilter());

  // File caricati (avatar) serviti su /uploads/**
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Swagger UI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RegexRiddle API')
    .setDescription('REST API per la piattaforma di sfide basate su espressioni regolari')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger-ui', app, document);

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port);
}

bootstrap();
